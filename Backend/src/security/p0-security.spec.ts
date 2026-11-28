import { BadRequestException, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserStatus } from '@prisma/client';
import { AccessService } from '../access/access.service';
import { P } from '../auth/permissions';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Principal } from '../common/types/principal';
import { ExaminationsService } from '../examinations/examinations.service';
import { StorageService } from '../storage/storage.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { PlacementsService } from '../placements/placements.service';
import { TimetableService } from '../timetable/timetable.service';
import { AttendanceService } from '../attendance/attendance.service';

const makePrincipal = (over: Partial<Principal> = {}): Principal => ({
  userId: 'u1',
  collegeId: 'c1',
  sessionId: 's1',
  roleKeys: ['STUDENT'],
  permissions: [P.ATTENDANCE_VIEW_OWN, P.FEE_VIEW_OWN],
  departmentIds: ['dept-cse'],
  studentId: 'stu-1',
  guardianOfStudentIds: [],
  isSuperAdmin: false,
  ...over,
});

describe('P0 Security Controls & Domain Invariants', () => {
  describe('StorageService.authorizeDownload ACL enforcement', () => {
    const buildStorage = (prismaOverrides: Record<string, unknown> = {}) => {
      const prisma = {
        document: { findFirst: jest.fn(async () => null) },
        submission: { findFirst: jest.fn(async () => null) },
        assignment: { findFirst: jest.fn(async () => null) },
        notice: { findFirst: jest.fn(async () => null) },
        ...prismaOverrides,
      };
      const svc = new StorageService(
        {} as never,
        { isClean: jest.fn(async () => true) } as never,
        { get: jest.fn(() => 25) } as never,
        prisma as never,
      );
      return { svc, prisma };
    };

    it('blocks cross-tenant downloads with FILE_REF_DENIED', async () => {
      const { svc } = buildStorage();
      await expect(
        svc.authorizeDownload(makePrincipal(), 'c1', 'c2/attachments/u9/file.pdf'),
      ).rejects.toMatchObject({ response: { errorCode: 'FILE_REF_DENIED' } });
    });

    it('blocks a student from downloading ADMIN_ONLY documents by key', async () => {
      const { svc } = buildStorage({
        document: {
          findFirst: jest.fn(async () => ({
            visibility: 'ADMIN_ONLY',
            departmentId: null,
            allowedRoleKeys: [],
            uploadedById: 'admin-1',
          })),
        },
      });
      await expect(
        svc.authorizeDownload(makePrincipal(), 'c1', 'c1/documents/admin-1/minutes.pdf'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('blocks a peer student from downloading another student submission file', async () => {
      const { svc } = buildStorage({
        submission: {
          findFirst: jest.fn(async () => ({
            studentId: 'stu-other',
            assignment: {
              createdById: 'teacher-u1',
              subjectOffering: { teacherId: 'teacher-1', subject: { departmentId: 'dept-cse' } },
            },
          })),
        },
      });
      await expect(
        svc.authorizeDownload(makePrincipal({ studentId: 'stu-1' }), 'c1', 'c1/attachments/u-other/sub.pdf'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        svc.authorizeDownload(makePrincipal({ studentId: 'stu-other' }), 'c1', 'c1/attachments/u-other/sub.pdf'),
      ).resolves.toBeUndefined();
    });

    it('blocks non-exporters from downloading /reports/ keys', async () => {
      const { svc } = buildStorage();
      await expect(
        svc.authorizeDownload(makePrincipal(), 'c1', 'c1/reports/admin-1/fees.csv'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('JwtAuthGuard session revocation & suspended tenant checks', () => {
    const httpCtx = (req: Record<string, unknown>) =>
      ({
        getType: () => 'http',
        getHandler: () => 'h',
        getClass: () => 'c',
        switchToHttp: () => ({ getRequest: () => req }),
      }) as unknown as ExecutionContext;

    it('rejects a DB-revoked session even when Redis is healthy and cache key is missing', async () => {
      const guard = new JwtAuthGuard(
        { getAllAndOverride: () => false } as unknown as Reflector,
        { verifyAccess: () => ({ sub: 'u1', sid: 'revoked-sid', cid: 'c1' }) } as never,
        { load: jest.fn() } as never,
        { isHealthy: () => true, safeExists: jest.fn(async () => false) } as never,
        {
          authSession: {
            findUnique: jest.fn(async () => ({
              revokedAt: new Date(),
              expiresAt: new Date(Date.now() + 60_000),
            })),
          },
        } as never,
      );
      await expect(guard.canActivate(httpCtx({ headers: { authorization: 'Bearer valid.jwt' } }))).rejects.toMatchObject({
        response: { errorCode: 'SESSION_REVOKED' },
      });
    });

    it('rejects active session when institution status is SUSPENDED', async () => {
      const guard = new JwtAuthGuard(
        { getAllAndOverride: () => false } as unknown as Reflector,
        { verifyAccess: () => ({ sub: 'u1', sid: 's1', cid: 'c1' }) } as never,
        {
          load: jest.fn(async () => ({
            ...makePrincipal(),
            status: UserStatus.ACTIVE,
            collegeStatus: 'SUSPENDED',
          })),
        } as never,
        { isHealthy: () => false } as never,
        {
          authSession: {
            findUnique: jest.fn(async () => ({
              revokedAt: null,
              expiresAt: new Date(Date.now() + 60_000),
            })),
          },
        } as never,
      );
      await expect(guard.canActivate(httpCtx({ headers: { authorization: 'Bearer valid.jwt' } }))).rejects.toMatchObject({
        response: { errorCode: 'COLLEGE_SUSPENDED' },
      });
    });
  });

  describe('ExaminationsService RESULT_UPDATE & CANCELLED exam guards', () => {
    const buildExamSvc = (examStatus: string, existingStatus: string) => {
      const prisma = {
        exam: { findFirst: jest.fn(async () => ({ id: 'ex1', collegeId: 'c1', status: examStatus, subjectOfferingId: 'off1', gradingSchemeId: null, maxMarks: 100 })) },
        subjectOffering: { findFirst: jest.fn(async () => ({ id: 'off1', teacherId: 't1', subject: { id: 's1', name: 'OS', departmentId: 'dept-cse' } })) },
        enrollment: { findMany: jest.fn(async () => [{ studentId: 'stu-1' }]) },
        gradingScheme: { findFirst: jest.fn(async () => null) },
        examResult: { findMany: jest.fn(async () => [{ id: 'r1', studentId: 'stu-1', status: existingStatus, marksObtained: 70, grade: 'B' }]) },
      };
      return new ExaminationsService(
        prisma as never,
        new AccessService(prisma as never),
        { assert: jest.fn() } as never,
        { log: jest.fn() } as never,
        { emit: jest.fn() } as never,
      );
    };

    it('rejects entering results on CANCELLED exams', async () => {
      const svc = buildExamSvc('CANCELLED', 'DRAFT');
      await expect(
        svc.enterResults(makePrincipal({ roleKeys: ['EXAM_CONTROLLER'], permissions: [P.RESULT_CREATE] }), 'c1', 'ex1', {
          results: [{ studentId: 'stu-1', marksObtained: 80 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('requires P.RESULT_UPDATE permission when changing already-published results', async () => {
      const svc = buildExamSvc('COMPLETED', 'PUBLISHED');
      await expect(
        svc.enterResults(makePrincipal({ roleKeys: ['EXAM_CONTROLLER'], permissions: [P.RESULT_CREATE] }), 'c1', 'ex1', {
          results: [{ studentId: 'stu-1', marksObtained: 85 }],
          reason: 'Re-evaluation correction',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('AnalyticsService HOD & Executive endpoints', () => {
    it('computes HOD facultyWorkloadHours and subjectPassRates', async () => {
      const prisma = {
        department: { findMany: jest.fn(async () => [{ id: 'd1', code: 'CSE', name: 'Computer Science' }]) },
        college: { findUniqueOrThrow: jest.fn(async () => ({ attendanceThreshold: 75 })) },
        student: { count: jest.fn(async () => 120), aggregate: jest.fn(async () => ({ _avg: { cgpa: 8.1 } })) },
        $queryRaw: jest.fn(async (sql: { strings?: readonly string[] }) => {
          const text = sql?.strings?.join(' ') ?? '';
          if (text.includes('GROUP BY sub.id')) {
            return [{ subjectId: 'sub1', subjectCode: 'CS501', subjectName: 'DBMS', evaluated: BigInt(50), passed: BigInt(46), avgScorePct: 78.4 }];
          }
          if (text.includes('AS pct') && text.includes('"Attendance"')) return [{ pct: 84.5 }];
          if (text.includes('AS n') && text.includes('"Attendance"')) return [{ n: BigInt(10) }];
          if (text.includes('AS pct') && text.includes('"ExamResult"')) return [{ pct: 91.2 }];
          if (text.includes('"Assignment"')) return [{ pct: 88 }];
          if (text.includes('"StudentFee"')) return [{ due: 100000, paid: 85000 }];
          if (text.includes('"Complaint"')) return [{ hours: 12, resolved: BigInt(4), total: BigInt(5) }];
          return [];
        }),
        jobApplication: { findMany: jest.fn(async () => [{ studentId: 's1' }]) },
        scholarshipApplication: { findMany: jest.fn(async () => [{ studentId: 's1' }]) },
        teacher: {
          findMany: jest.fn(async () => [
            {
              id: 't1',
              employeeId: 'CSE-T01',
              user: { firstName: 'Asha', lastName: 'Rao', loginId: 'CSE-T01' },
              department: { id: 'd1', code: 'CSE' },
              subjectOfferings: [
                {
                  timetableSlots: [{ startMinute: 540, endMinute: 600 }, { startMinute: 600, endMinute: 660 }],
                  attendanceSessions: [{ id: 'as1' }],
                },
              ],
            },
          ]),
        },
        attendanceCorrection: { count: jest.fn(async () => 2) },
        leaveRequest: { count: jest.fn(async () => 1) },
        subject: { count: jest.fn(async () => 6) },
      };
      const svc = new AnalyticsService(prisma as never);
      const res = await svc.hodDepartment(makePrincipal({ roleKeys: ['HOD'], departmentIds: ['d1'] }), 'c1');
      expect(res.facultyWorkloadHours[0]).toMatchObject({ employeeId: 'CSE-T01', weeklyHours: 2, sessionsLast30Days: 1 });
      expect(res.subjectPassRates[0]).toMatchObject({ subjectCode: 'CS501', passPercentage: 92 });
      expect(res.pendingCorrectionsCount).toBe(2);
    });
  });

  describe('PlacementsService offer response state & student scope', () => {
    it('atomically marks both Offer and JobApplication ACCEPTED and writes audit log', async () => {
      const offerUpdate = jest.fn(async () => ({ id: 'off1', applicationId: 'app1', status: 'ACCEPTED' }));
      const appUpdate = jest.fn(async () => ({ id: 'app1', status: 'ACCEPTED' }));
      const auditLog = jest.fn(async () => undefined);
      const prisma = {
        offer: {
          findFirst: jest.fn(async () => ({
            id: 'off1',
            applicationId: 'app1',
            status: 'ISSUED',
            application: { id: 'app1', status: 'OFFERED' },
          })),
        },
        $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
          fn({ offer: { update: offerUpdate }, jobApplication: { update: appUpdate } }),
        ),
      };
      const svc = new PlacementsService(prisma as never, { assert: jest.fn() } as never, { log: auditLog } as never, { emit: jest.fn() } as never);
      const res = await svc.respondToOffer('stu-1', 'c1', 'off1', true, 'u1');
      expect(res.status).toBe('ACCEPTED');
      expect(appUpdate).toHaveBeenCalledWith({ where: { id: 'app1' }, data: { status: 'ACCEPTED' } });
      expect(auditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'OFFER_ACCEPT', entityId: 'off1' }), expect.anything());
    });

    it('rejects respondToOffer when caller lacks a studentId', async () => {
      const svc = new PlacementsService({} as never, { assert: jest.fn() } as never, { log: jest.fn() } as never, { emit: jest.fn() } as never);
      await expect(svc.respondToOffer(undefined, 'c1', 'off1', true)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('TimetableException & Cancelled Lecture Enforcement', () => {
    it('allows slot teacher to cancel a single lecture date and prevents outsider cancellation', async () => {
      const slot = {
        id: 'slot1',
        collegeId: 'c1',
        subjectOfferingId: 'off1',
        dayOfWeek: 'MON',
        startMinute: 540,
        endMinute: 600,
        subjectOffering: { teacherId: 't1', subject: { departmentId: 'dept-cse' } },
      };
      const prisma = {
        timetableSlot: { findFirst: jest.fn(async () => slot) },
        timetableException: {
          upsert: jest.fn(async (args) => ({ id: 'exc1', ...args.create })),
        },
      };
      const svc = new TimetableService(
        prisma as never,
        { assert: jest.fn(async () => undefined) } as never,
        new AccessService(prisma as never),
        { log: jest.fn(async () => undefined) } as never,
      );

      const res = await svc.createException(makePrincipal({ roleKeys: ['TEACHER'], teacherId: 't1', studentId: undefined }), 'c1', {
        slotId: 'slot1',
        date: new Date('2026-11-26T00:00:00Z'),
        type: 'CANCELLED',
        reason: 'Faculty workshop duty',
      });
      expect(res.type).toBe('CANCELLED');

      await expect(
        svc.createException(makePrincipal({ roleKeys: ['TEACHER'], teacherId: 't-other', studentId: undefined }), 'c1', {
          slotId: 'slot1',
          date: new Date('2026-11-26T00:00:00Z'),
          type: 'CANCELLED',
          reason: 'Unauthorized cancel attempt',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects marking attendance when the scheduled lecture date is CANCELLED', async () => {
      const prisma = {
        timetableException: {
          findFirst: jest.fn(async () => ({ id: 'exc1', type: 'CANCELLED', slotId: 'slot1' })),
        },
      };
      const attSvc = new AttendanceService(
        prisma as never,
        new AccessService(prisma as never),
        { log: jest.fn() } as never,
        { emit: jest.fn() } as never,
      );

      await expect(
        attSvc.mark(makePrincipal({ roleKeys: ['TEACHER'], teacherId: 't1', studentId: undefined }), 'c1', {
          subjectOfferingId: 'off1',
          timetableSlotId: 'slot1',
          date: new Date('2026-11-26T00:00:00Z'),
          records: [],
        }),
      ).rejects.toMatchObject({ response: { errorCode: 'LECTURE_CANCELLED' } });
    });
  });
});
