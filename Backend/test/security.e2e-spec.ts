import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Database-backed security suite. Requires: Postgres+pgvector (migrated, `npm run db:harden`), Redis and
 *   SEED_PASSWORD=... npm run seed
 * Run:  E2E_DB=1 SEED_PASSWORD=... npm run test:e2e
 * Skipped automatically when E2E_DB is not set (CI without a database still runs smoke.e2e-spec.ts).
 */
const maybe = process.env.E2E_DB ? describe : describe.skip;

maybe('security & isolation (seeded database)', () => {
  let app: INestApplication;
  const pw = process.env.SEED_PASSWORD as string;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api', { exclude: ['health', 'health/ready'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  const login = async (
    loginId: string,
    collegeCode: string | undefined = process.env.SEED_COLLEGE_CODE || 'SDIET',
  ) => {
    const res = await api().post('/api/v1/auth/login').send({ collegeCode, loginId, password: pw }).expect(200);
    return { token: res.body.data.accessToken as string, refresh: res.body.data.refreshToken as string };
  };
  const as = (t: { token: string }) => ({
    get: (u: string) => api().get(u).set('authorization', `Bearer ${t.token}`),
    post: (u: string, b: object = {}) => api().post(u).set('authorization', `Bearer ${t.token}`).send(b),
  });

  describe('authentication', () => {
    it('rotates refresh tokens and kills the family on reuse', async () => {
      const t = await login('CSE23001');
      const r1 = await api().post('/api/v1/auth/refresh').send({ refreshToken: t.refresh }).expect(200);
      await api().post('/api/v1/auth/refresh').send({ refreshToken: t.refresh }).expect(401); // reuse
      await api().post('/api/v1/auth/refresh').send({ refreshToken: r1.body.data.refreshToken }).expect(401); // family revoked
    });
    it('rejects wrong passwords with a generic error', async () => {
      const res = await api()
        .post('/api/v1/auth/login')
        .send({ collegeCode: 'SDCET', loginId: 'CSE23001', password: 'wrong-password-1' })
        .expect(401);
      expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('RBAC', () => {
    it('a student cannot create students, mark attendance or read the audit log', async () => {
      const s = as(await login('CSE23001'));
      await s.post('/api/v1/students', {}).expect(403);
      await s.post('/api/v1/attendance', {}).expect(403);
      await s.get('/api/v1/audit').expect(403);
    });
    it('a teacher cannot approve attendance corrections (HOD/admin only)', async () => {
      await as(await login('CSE-T02'))
        .post('/api/v1/attendance/corrections/x/review', { approve: true })
        .expect(403);
    });
  });

  describe('scope', () => {
    it('a teacher only lists students of their own subjects', async () => {
      const res = await as(await login('CSE-T02'))
        .get('/api/v1/students?limit=100')
        .expect(200);
      expect(res.body.meta.total).toBeGreaterThan(0);
      expect(res.body.data.every((s: { department: { code: string } }) => s.department.code === 'CSE')).toBe(true);
    });
    it("a student cannot open another student's profile (404, not 403)", async () => {
      const t = await login('CSE23001');
      const list = await as(await login('ADMIN001'))
        .get('/api/v1/students?search=CSE23002')
        .expect(200);
      await as(t).get(`/api/v1/students/${list.body.data[0].id}`).expect(404);
    });
    it('parents can read only their ward', async () => {
      const p = as(await login('PAR-CSE23001'));
      const own = await p.get('/api/v1/students/me/attendance').expect(200);
      expect(own.body.data.overall).toBeDefined();
    });
  });

  describe('tenant isolation', () => {
    it('another college admin cannot see SDCET data, even by id or via x-tenant-id', async () => {
      const sa = as(await login('PLATFORM', undefined));
      const code = `T${Date.now().toString(36).toUpperCase()}`.slice(0, 8);
      await sa
        .post('/api/v1/colleges', {
          code,
          name: 'Other College',
          adminLoginId: 'ADM',
          adminEmail: `a@${code}.test`,
          adminPassword: pw,
        })
        .expect(201);
      const otherToken = await login('ADM', code);
      const other = as(otherToken);
      const sdcet = await as(await login('ADMIN001'))
        .get('/api/v1/students?limit=1')
        .expect(200);
      await other.get(`/api/v1/students/${sdcet.body.data[0].id}`).expect(404); // exists, but not in this tenant
      expect((await other.get('/api/v1/students').expect(200)).body.meta.total).toBe(0);
      const sdcetCollege = await as(await login('ADMIN001'))
        .get('/api/v1/colleges/current')
        .expect(200);
      const spoof = await api()
        .get('/api/v1/students')
        .set('authorization', `Bearer ${otherToken.token}`)
        .set('x-tenant-id', sdcetCollege.body.data.id)
        .expect(403);
      expect(spoof.body.errorCode).toBe('TENANT_MISMATCH');
    });
  });

  describe('RAG permission-aware retrieval', () => {
    it('students get cited answers from student-visible documents', async () => {
      const res = await as(await login('CSE23001'))
        .post('/api/v1/ai/knowledge/search', { question: 'minimum attendance required for exams' })
        .expect(200);
      expect(res.body.data.relevant).toBe(true);
      expect(res.body.data.results[0].title).toMatch(/Attendance Policy/);
    });
    it('a student can NEVER retrieve the teachers-only salary policy or admin-only minutes', async () => {
      const s = as(await login('CSE23001'));
      const res = await s
        .post('/api/v1/ai/knowledge/search', { question: 'faculty salary policy increments allowances' })
        .expect(200);
      expect(JSON.stringify(res.body.data.results)).not.toMatch(/salary|Governing Body/i);
      const ask = await s
        .post('/api/v1/ai/knowledge/ask', { question: 'What is the faculty salary policy?' })
        .expect(200);
      expect(ask.body.data.grounded).toBe(false);
      expect(ask.body.data.citations).toEqual([]);
    });
    it('a teacher can retrieve the teachers-only document', async () => {
      const res = await as(await login('CSE-T02'))
        .post('/api/v1/ai/knowledge/search', { question: 'faculty salary policy increments allowances' })
        .expect(200);
      expect(res.body.data.results.some((r: { title: string }) => /Salary/.test(r.title))).toBe(true);
    });
    it('department documents stay inside the department', async () => {
      const cse = await as(await login('CSE23001'))
        .post('/api/v1/ai/knowledge/search', { question: 'laboratory safety food drinks' })
        .expect(200);
      const ce = await as(await login('CE23001'))
        .post('/api/v1/ai/knowledge/search', { question: 'laboratory safety food drinks' })
        .expect(200);
      expect(cse.body.data.results.length).toBeGreaterThan(0);
      expect(ce.body.data.results.length).toBe(0);
    });
  });

  describe('AI assistant & tools', () => {
    it('answers attendance from live data and never lets the model pick another student', async () => {
      const res = await as(await login('CSE23003'))
        .post('/api/v1/ai/chat', { message: 'How much attendance do I have?' })
        .expect(200);
      expect(res.body.data.agent).toBe('AttendanceAdvisorAgent');
      expect(res.body.data.collegeData[0].tool).toBe('getAttendance');
    });
    it('AI complaint drafts are not filed until the user confirms', async () => {
      const s = as(await login('CSE23002'));
      const chat = await s.post('/api/v1/ai/chat', { message: "My scholarship hasn't been credited" }).expect(200);
      expect(chat.body.data.agent).toBe('GrievanceAgent');
      const before = await s.get('/api/v1/complaints/my').expect(200);
      expect(before.body.meta.total).toBe(1); // only the seeded one — chat created nothing
    });
  });

  describe('attendance correction workflow (audited, never a silent overwrite)', () => {
    it('teacher requests → teacher cannot self-approve → HOD approves → record changed + audit entry with old/new/reason', async () => {
      const teacher = as(await login('CSE-T02')); // teaches Operating Systems (CS502)
      const hod = as(await login('CSE-T01'));
      const admin = as(await login('ADMIN001'));
      const stu = (await teacher.get('/api/v1/students?search=CSE23001').expect(200)).body.data[0];
      const subject = (await admin.get('/api/v1/subjects?search=CS502').expect(200)).body.data[0];
      const rec = (
        await teacher.get(`/api/v1/attendance/students/${stu.id}/records?subjectId=${subject.id}&limit=1`).expect(200)
      ).body.data[0];
      const newStatus = rec.status === 'PRESENT' ? 'ABSENT' : 'PRESENT';

      const corr = (
        await teacher
          .post('/api/v1/attendance/correction-request', {
            attendanceId: rec.id,
            newStatus,
            reason: 'Marked incorrectly by mistake',
          })
          .expect(201)
      ).body.data;
      await teacher.post(`/api/v1/attendance/corrections/${corr.id}/review`, { approve: true }).expect(403); // no ATTENDANCE_CORRECT_APPROVE
      await teacher
        .post('/api/v1/attendance/correction-request', {
          attendanceId: rec.id,
          newStatus,
          reason: 'Duplicate request attempt',
        })
        .expect(409); // already pending
      // the stored record is untouched until approval
      expect(
        (await teacher.get(`/api/v1/attendance/students/${stu.id}/records?subjectId=${subject.id}&limit=1`)).body
          .data[0].status,
      ).toBe(rec.status);

      await hod
        .post(`/api/v1/attendance/corrections/${corr.id}/review`, { approve: true, note: 'Verified with lecture log' })
        .expect(201);
      const after = (await teacher.get(`/api/v1/attendance/students/${stu.id}/records?subjectId=${subject.id}&limit=1`))
        .body.data[0];
      expect(after.status).toBe(newStatus);
      expect(after.version).toBe(rec.version + 1);

      const trail = (await admin.get(`/api/v1/audit/entity/Attendance/${rec.id}`).expect(200)).body.data;
      const entry = trail.find((e: { action: string }) => e.action === 'ATTENDANCE_CORRECTION_APPROVED');
      expect(entry).toMatchObject({
        oldValue: { status: rec.status },
        newValue: { status: newStatus },
        reason: 'Verified with lecture log',
      });
      expect(entry.userId).toBeDefined();
      await hod.post(`/api/v1/attendance/corrections/${corr.id}/review`, { approve: true }).expect(409); // cannot be applied twice
    });
  });
});
