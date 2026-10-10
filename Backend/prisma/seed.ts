/* eslint-disable no-console */
/**
 * Development seed. Creates one realistic college with scenarios that exercise the intelligence features
 * (attendance shortage, a declining student, overdue fees, an escalated complaint, role-restricted documents…).
 *
 *   SEED_PASSWORD='Dev-Passw0rd-123' npm run seed
 *
 * Refuses to run in production. Passwords come ONLY from SEED_PASSWORD — nothing is hardcoded.
 * All people, marks and policy texts below are SAMPLE DATA, not real records or real college rules.
 */
import { PrismaClient, AttendanceStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ALL_PERMISSIONS, ROLE, ROLE_PERMISSIONS, RoleKey } from '../src/auth/permissions';
import { gradeFor } from '../src/examinations/grading';
import { classifyComplaint, slaDueAt } from '../src/complaints/workflow';

const prisma = new PrismaClient();
const DAY = 86_400_000;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261009);
const utcDay = (offsetDays: number) => {
  const d = new Date(Date.now() + offsetDays * DAY);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};
const pastWeekdays = (n: number) => {
  const out: Date[] = [];
  for (let i = 1; out.length < n; i++) {
    const d = utcDay(-i);
    if (d.getUTCDay() % 6 !== 0) out.push(d);
  }
  return out.reverse();
};

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed in production');
  const password = process.env.SEED_PASSWORD;
  if (!password || !/^(?=.*[A-Za-z])(?=.*\d).{10,}$/.test(password))
    throw new Error('Set SEED_PASSWORD (10+ chars, letters and digits) to create development logins');
  if (await prisma.college.findUnique({ where: { code: 'SDIET' } })) {
    console.log('SDIET already seeded — nothing to do.');
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);

  // ── permissions & roles ────────────────────────────
  for (const key of ALL_PERMISSIONS)
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, module: key.split('_')[0].toLowerCase() },
    });
  const perms = new Map((await prisma.permission.findMany()).map((p) => [p.key, p.id]));
  let superRole = await prisma.role.findFirst({ where: { collegeId: null, key: ROLE.SUPER_ADMIN } });
  if (!superRole) {
    superRole = await prisma.role.create({ data: { key: ROLE.SUPER_ADMIN, name: 'Super Admin', isSystem: true } });
    await prisma.rolePermission.createMany({
      data: [...perms.values()].map((permissionId) => ({ roleId: superRole!.id, permissionId })),
    });
  }

  // ── college & org structure ────────────────────────
  const college = await prisma.college.create({
    data: {
      code: 'SDIET',
      name: 'Satyug Darshan Institute of Engineering and Technology',
      domain: 'sdcet.example',
      attendanceMode: 'PER_LECTURE',
      attendanceThreshold: 75,
    },
  });
  const c = college.id;
  const roleIds = new Map<string, string>();
  for (const key of Object.keys(ROLE_PERMISSIONS).filter((k) => k !== ROLE.SUPER_ADMIN) as RoleKey[]) {
    const r = await prisma.role.create({ data: { collegeId: c, key, name: key, isSystem: true } });
    roleIds.set(key, r.id);
    await prisma.rolePermission.createMany({
      data: Array.from(new Set(ROLE_PERMISSIONS[key])).map((p) => ({ roleId: r.id, permissionId: perms.get(p)! })),
      skipDuplicates: true,
    });
  }
  const campus = await prisma.campus.create({ data: { collegeId: c, code: 'MAIN', name: 'Main Campus' } });
  const deptNames: Record<string, string> = {
    CSE: 'Computer Science & Engineering',
    CE: 'Civil Engineering',
    GEN: 'General Studies',
    DS: 'Data Science',
    FSB: 'FSB',
    DM: 'DM',
  }; // rename FSB/DM to your actual department names
  const dept: Record<string, string> = {};
  for (const [code, name] of Object.entries(deptNames))
    dept[code] = (await prisma.department.create({ data: { collegeId: c, campusId: campus.id, code, name } })).id;
  const prog: Record<string, string> = {};
  for (const [code, name, n] of [
    ['B.Tech', 'Bachelor of Technology', 8],
    ['BBA', 'Bachelor of Business Administration', 6],
    ['BCA', 'Bachelor of Computer Applications', 6],
  ] as const)
    prog[code] = (await prisma.program.create({ data: { collegeId: c, code, name, durationSemesters: n } })).id;

  const mkBatch = async (program: string, department: string, start: number, semNo: number) => {
    const batch = await prisma.batch.create({
      data: {
        collegeId: c,
        programId: prog[program],
        departmentId: dept[department],
        startYear: start,
        endYear: start + (program === 'B.Tech' ? 4 : 3),
        name: `${program}-${department} ${start}`,
      },
    });
    const sem = await prisma.semester.create({
      data: {
        collegeId: c,
        batchId: batch.id,
        number: semNo,
        academicYear: '2026-27',
        startDate: utcDay(-75),
        endDate: utcDay(60),
        isCurrent: true,
      },
    });
    return { batch, sem };
  };
  const cse = await mkBatch('B.Tech', 'CSE', 2023, 5);
  const ce = await mkBatch('B.Tech', 'CE', 2023, 5);
  const bca = await mkBatch('BCA', 'DS', 2024, 3);
  const bba = await mkBatch('BBA', 'DM', 2024, 3);
  const secA = await prisma.section.create({ data: { collegeId: c, semesterId: cse.sem.id, name: 'A', capacity: 60 } });
  const secB = await prisma.section.create({ data: { collegeId: c, semesterId: cse.sem.id, name: 'B', capacity: 60 } });
  const secCE = await prisma.section.create({ data: { collegeId: c, semesterId: ce.sem.id, name: 'A' } });
  await prisma.section.create({ data: { collegeId: c, semesterId: bca.sem.id, name: 'A' } });
  await prisma.section.create({ data: { collegeId: c, semesterId: bba.sem.id, name: 'A' } });

  // ── people ─────────────────────────────────────────
  const mkUser = async (loginId: string, first: string, last: string, roles: string[], departmentId?: string) => {
    const u = await prisma.user.create({
      data: {
        collegeId: c,
        loginId,
        email: `${loginId.toLowerCase()}@sdcet.example`,
        passwordHash,
        firstName: first,
        lastName: last,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        userRoles: {
          create: roles.map((r) => ({
            roleId: roleIds.get(r)!,
            departmentId: r === ROLE.HOD ? departmentId : undefined,
          })),
        },
      },
    });
    return u;
  };
  await prisma.user.create({
    data: {
      collegeId: null,
      loginId: 'PLATFORM',
      email: 'platform@college-os.example',
      passwordHash,
      firstName: 'Platform',
      lastName: 'Admin',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      userRoles: { create: [{ roleId: superRole.id }] },
    },
  });
  await mkUser('ADMIN001', 'Anita', 'Verma', [ROLE.COLLEGE_ADMIN]);
  await mkUser('ACC001', 'Rohit', 'Mehta', [ROLE.ACCOUNTANT]);
  await mkUser('EXAM001', 'Sunita', 'Rao', [ROLE.EXAM_CONTROLLER]);
  await mkUser('PLC001', 'Karan', 'Malhotra', [ROLE.PLACEMENT_OFFICER]);
  await mkUser('SUP001', 'Imran', 'Sheikh', [ROLE.SUPPORT_STAFF]);

  const teacherDefs: [string, string, string, string, boolean][] = [
    ['CSE-T01', 'Dr. Meera', 'Kulkarni', 'CSE', true],
    ['CSE-T02', 'Arjun', 'Nair', 'CSE', false],
    ['CSE-T03', 'Pooja', 'Iyer', 'CSE', false],
    ['CSE-T04', 'Sandeep', 'Joshi', 'CSE', false],
    ['CSE-T05', 'Neha', 'Bansal', 'CSE', false],
    ['CE-T01', 'Vikram', 'Singh', 'CE', true],
  ];
  const teacher: Record<string, string> = {}; // loginId → teacher.id
  const teacherUser: Record<string, string> = {};
  for (const [id, f, l, d, hod] of teacherDefs) {
    const u = await mkUser(id, f, l, hod ? [ROLE.TEACHER, ROLE.HOD] : [ROLE.TEACHER], dept[d]);
    const t = await prisma.teacher.create({
      data: {
        collegeId: c,
        userId: u.id,
        employeeId: id,
        departmentId: dept[d],
        designation: hod ? 'Professor & HOD' : 'Assistant Professor',
      },
    });
    teacher[id] = t.id;
    teacherUser[id] = u.id;
    if (hod) await prisma.department.update({ where: { id: dept[d] }, data: { hodUserId: u.id } });
  }

  const names = [
    'Aarav Sharma',
    'Diya Patel',
    'Kabir Khan',
    'Ananya Reddy',
    'Rohan Das',
    'Ishita Gupta',
    'Vivaan Mishra',
    'Saanvi Joshi',
    'Aditya Rao',
    'Myra Kapoor',
    'Reyansh Jain',
    'Kiara Menon',
    'Arnav Bhatt',
    'Zoya Ali',
    'Dev Chauhan',
    'Tara Pillai',
    'Yash Agarwal',
    'Navya Nambiar',
  ];
  const studentCse: { id: string; userId: string; name: string }[] = [];
  for (let i = 0; i < 18; i++) {
    const [f, l] = names[i].split(' ');
    const sec = i < 12 ? secA : secB;
    const login = `CSE23${String(i + 1).padStart(3, '0')}`;
    const u = await mkUser(login, f, l, [ROLE.STUDENT]);
    const s = await prisma.student.create({
      data: {
        collegeId: c,
        userId: u.id,
        collegeStudentId: login,
        rollNumber: `${i < 12 ? 'A' : 'B'}${String(i + 1).padStart(2, '0')}`,
        departmentId: dept.CSE,
        programId: prog['B.Tech'],
        batchId: cse.batch.id,
        sectionId: sec.id,
        semesterId: cse.sem.id,
        cgpa: Math.round((6 + rand() * 3) * 100) / 100,
      },
    });
    studentCse.push({ id: s.id, userId: u.id, name: names[i] });
  }
  for (let i = 0; i < 3; i++) {
    const u = await mkUser(
      `CE23${String(i + 1).padStart(3, '0')}`,
      ['Neel', 'Riya', 'Om'][i],
      ['Thakur', 'Saxena', 'Kulkarni'][i],
      [ROLE.STUDENT],
    );
    await prisma.student.create({
      data: {
        collegeId: c,
        userId: u.id,
        collegeStudentId: `CE23${String(i + 1).padStart(3, '0')}`,
        rollNumber: `C${i + 1}`,
        departmentId: dept.CE,
        programId: prog['B.Tech'],
        batchId: ce.batch.id,
        sectionId: secCE.id,
        semesterId: ce.sem.id,
        cgpa: 7.1,
      },
    });
  }
  const parent = await mkUser('PAR-CSE23001', 'Suresh', 'Sharma', [ROLE.PARENT]);
  await prisma.guardian.create({
    data: {
      studentId: studentCse[0].id,
      userId: parent.id,
      name: 'Suresh Sharma',
      relation: 'Father',
      phone: '+910000000000',
    },
  });
  for (const [i, skills] of [
    [0, ['typescript', 'react', 'sql']],
    [1, ['python', 'sql', 'machine learning']],
    [2, ['java', 'spring']],
    [3, ['react', 'node']],
  ] as [number, string[]][]) {
    await prisma.studentSkill.createMany({
      data: skills.map((name) => ({ studentId: studentCse[i].id, name, level: 3 })),
    });
  }
  await prisma.studentPortfolioItem.create({
    data: {
      studentId: studentCse[0].id,
      type: 'PROJECT',
      title: 'Campus event portal',
      description: 'Full-stack app built with React and SQL',
      tags: ['react', 'sql', 'typescript'],
    },
  });

  // ── subjects, offerings, timetable ─────────────────
  const subjDefs: [string, string, string][] = [
    ['CS501', 'Database Management Systems', 'CSE-T01'],
    ['CS502', 'Operating Systems', 'CSE-T02'],
    ['CS503', 'Computer Networks', 'CSE-T03'],
    ['CS504', 'Software Engineering', 'CSE-T04'],
    ['CS505', 'Theory of Computation', 'CSE-T05'],
  ];
  const room = await prisma.room.create({ data: { collegeId: c, campusId: campus.id, code: 'A-101', capacity: 70 } });
  const room2 = await prisma.room.create({ data: { collegeId: c, campusId: campus.id, code: 'A-102', capacity: 70 } });
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'] as const;
  const offerings: { id: string; subjectId: string; name: string; teacherLogin: string; slotId: string }[] = [];
  let slotNo = 0;
  for (const [code, name, tl] of subjDefs) {
    const subject = await prisma.subject.create({
      data: { collegeId: c, departmentId: dept.CSE, code, name, credits: 4, semesterNumber: 5 },
    });
    for (const sec of [secA, secB]) {
      const off = await prisma.subjectOffering.create({
        data: {
          collegeId: c,
          subjectId: subject.id,
          semesterId: cse.sem.id,
          sectionId: sec.id,
          teacherId: teacher[tl],
        },
      });
      const students = await prisma.student.findMany({ where: { sectionId: sec.id }, select: { id: true } });
      await prisma.enrollment.createMany({
        data: students.map((s) => ({ collegeId: c, studentId: s.id, subjectOfferingId: off.id })),
      });
      const idx = slotNo++;
      const slot = await prisma.timetableSlot.create({
        data: {
          collegeId: c,
          subjectOfferingId: off.id,
          roomId: sec === secA ? room.id : room2.id,
          dayOfWeek: days[idx % 5],
          startMinute: 540 + 60 * Math.floor((idx / 5) % 4) + (sec === secB ? 0 : 0),
          endMinute: 600 + 60 * Math.floor((idx / 5) % 4),
          validFrom: utcDay(-75),
        },
      });
      if (sec === secA) offerings.push({ id: off.id, subjectId: subject.id, name, teacherLogin: tl, slotId: slot.id });
    }
  }

  // ── attendance (PER_LECTURE) with built-in scenarios ──
  // idx2 chronic shortage · idx6 borderline · idx4 sudden decline · idx9 shortage
  const profile = (i: number, j: number, total: number): number =>
    i === 2 ? 0.6 : i === 9 ? 0.55 : i === 6 ? 0.78 : i === 4 ? (j >= total - 5 ? 0.15 : 0.97) : 0.92;
  const dates = pastWeekdays(16);
  for (const o of offerings) {
    await prisma.attendanceSession.createMany({
      data: dates.map((date) => ({
        collegeId: c,
        subjectOfferingId: o.id,
        timetableSlotId: o.slotId,
        date,
        periodKey: `${o.slotId}:${date.toISOString().slice(0, 10)}`,
        mode: 'PER_LECTURE' as const,
        markedById: teacherUser[o.teacherLogin],
      })),
    });
    const sessions = await prisma.attendanceSession.findMany({
      where: { subjectOfferingId: o.id },
      orderBy: { date: 'asc' },
    });
    const rows: Prisma.AttendanceCreateManyInput[] = [];
    sessions.forEach((s, j) =>
      studentCse.slice(0, 12).forEach((st, i) => {
        const r = rand();
        const status: AttendanceStatus =
          r < profile(i, j, sessions.length)
            ? 'PRESENT'
            : r < profile(i, j, sessions.length) + 0.02
              ? 'EXCUSED'
              : 'ABSENT';
        rows.push({
          collegeId: c,
          sessionId: s.id,
          studentId: st.id,
          subjectId: o.subjectId,
          date: s.date,
          status,
          markedById: teacherUser[o.teacherLogin],
        });
      }),
    );
    await prisma.attendance.createMany({ data: rows });
  }

  // ── assignments ────────────────────────────────────
  const asgIds: string[] = [];
  for (const [k, o] of offerings.slice(0, 3).entries()) {
    const past = await prisma.assignment.create({
      data: {
        collegeId: c,
        subjectOfferingId: o.id,
        createdById: teacherUser[o.teacherLogin],
        title: `${o.name} — Assignment 1`,
        description: 'Sample assignment',
        dueAt: new Date(Date.now() - 5 * DAY),
        maxMarks: 20,
        rubric: [
          { criterion: 'Correctness', maxMarks: 12 },
          { criterion: 'Presentation', maxMarks: 8 },
        ],
      },
    });
    asgIds.push(past.id);
    for (const [i, st] of studentCse.slice(0, 12).entries()) {
      if (i === 2 || i === 9 || (k === 1 && i === 4)) continue; // missing submissions
      await prisma.submission.create({
        data: {
          assignmentId: past.id,
          studentId: st.id,
          status: 'GRADED',
          text: 'Sample submission',
          marks: Math.round(10 + rand() * 10),
          feedback: 'Good effort',
          gradedById: teacherUser[o.teacherLogin],
          gradedAt: new Date(),
        },
      });
    }
  }
  await prisma.assignment.create({
    data: {
      collegeId: c,
      subjectOfferingId: offerings[2].id,
      createdById: teacherUser[offerings[2].teacherLogin],
      title: 'Computer Networks — Subnetting worksheet',
      dueAt: new Date(Date.now() + 3 * DAY),
      maxMarks: 10,
    },
  });

  // ── exams & published mid-sem results ──────────────
  const hodUser = teacherUser['CSE-T01'];
  for (const [k, o] of offerings.entries()) {
    const mid = await prisma.exam.create({
      data: {
        collegeId: c,
        subjectOfferingId: o.id,
        type: 'MID_SEM',
        title: `${o.name} — Mid Semester`,
        scheduledAt: new Date(Date.now() - 20 * DAY),
        durationMinutes: 90,
        maxMarks: 50,
        passMarks: 20,
        status: 'COMPLETED',
        roomId: room.id,
      },
    });
    for (const [i, st] of studentCse.slice(0, 12).entries()) {
      const ability = i === 4 ? 0.42 : i === 2 ? 0.45 : i === 9 ? 0.5 : 0.62 + rand() * 0.32;
      const marks = Math.min(50, Math.round(ability * (k === 0 && i === 6 ? 0.8 : 1) * 50 + rand() * 4));
      const g = gradeFor(marks, 50);
      await prisma.examResult.create({
        data: {
          collegeId: c,
          examId: mid.id,
          studentId: st.id,
          marksObtained: marks,
          grade: g.grade,
          gradePoints: g.points,
          status: 'PUBLISHED',
          publishedAt: new Date(Date.now() - 15 * DAY),
          enteredById: teacherUser[o.teacherLogin],
        },
      });
    }
  }
  await prisma.exam.create({
    data: {
      collegeId: c,
      subjectOfferingId: offerings[0].id,
      type: 'END_SEM',
      title: 'DBMS — End Semester',
      scheduledAt: new Date(Date.now() + 5 * DAY + 9 * 3600_000),
      durationMinutes: 180,
      maxMarks: 100,
      passMarks: 40,
      roomId: room.id,
    },
  });
  await prisma.exam.create({
    data: {
      collegeId: c,
      subjectOfferingId: offerings[1].id,
      type: 'END_SEM',
      title: 'OS — End Semester',
      scheduledAt: new Date(Date.now() + 12 * DAY + 9 * 3600_000),
      durationMinutes: 180,
      maxMarks: 100,
      passMarks: 40,
      roomId: room.id,
    },
  });

  // ── fees ───────────────────────────────────────────
  const fs = await prisma.feeStructure.create({
    data: {
      collegeId: c,
      programId: prog['B.Tech'],
      batchId: cse.batch.id,
      name: 'Tuition & Lab Fee',
      academicYear: '2026-27',
      components: [
        { name: 'Tuition', amount: 75000 },
        { name: 'Lab', amount: 10000 },
      ],
      totalAmount: 85000,
    },
  });
  for (const [i, st] of studentCse.entries()) {
    const paid = i % 3 === 0 ? 85000 : i % 3 === 1 ? 40000 : 0;
    await prisma.studentFee.create({
      data: {
        collegeId: c,
        studentId: st.id,
        feeStructureId: fs.id,
        amountDue: 85000,
        amountPaid: paid,
        dueDate: utcDay(i % 2 ? -10 : 12),
        status: paid === 85000 ? 'PAID' : paid ? 'PARTIAL' : i % 2 ? 'OVERDUE' : 'PENDING',
      },
    });
  }

  // ── scholarships, placements ───────────────────────
  await prisma.scholarship.createMany({
    data: [
      {
        collegeId: c,
        type: 'COLLEGE',
        name: 'SDIET Merit Scholarship',
        provider: 'SDIET',
        description: 'Sample: for high performers',
        eligibility: { minCgpa: 8, minAttendance: 80, programs: ['B.Tech'] },
        requiredDocuments: ['Previous semester marksheet', 'ID card'],
        amount: 25000,
        deadline: utcDay(9),
      },
      {
        collegeId: c,
        type: 'GOVERNMENT',
        name: 'Sample Post-Matric Scholarship',
        provider: 'Government (sample)',
        description: 'Sample income-based scheme',
        eligibility: { maxFamilyIncome: 250000 },
        requiredDocuments: ['Income certificate', 'Bank passbook', 'Aadhaar-linked bank proof'],
        deadline: utcDay(2),
      },
      {
        collegeId: c,
        type: 'PRIVATE',
        name: 'Sample Women in Tech Grant',
        provider: 'Sample Foundation',
        eligibility: { minCgpa: 7, programs: ['B.Tech', 'BCA'] },
        requiredDocuments: ['Resume', 'Statement of purpose'],
        deadline: utcDay(30),
      },
    ],
  });
  const acme = await prisma.company.create({
    data: { collegeId: c, name: 'Acme Software (sample)', industry: 'Software' },
  });
  const nova = await prisma.company.create({
    data: { collegeId: c, name: 'Nova Analytics (sample)', industry: 'Data' },
  });
  const job1 = await prisma.job.create({
    data: {
      collegeId: c,
      companyId: acme.id,
      title: 'Software Engineer',
      requiredSkills: ['typescript', 'react', 'sql'],
      minCgpa: 7,
      allowedDepartments: [],
      ctc: 600000,
      deadline: utcDay(0),
    },
  });
  await prisma.job.create({
    data: {
      collegeId: c,
      companyId: nova.id,
      title: 'Data Analyst',
      requiredSkills: ['python', 'sql', 'machine learning'],
      minCgpa: 6.5,
      allowedDepartments: [dept.CSE, dept.DS],
      ctc: 500000,
      deadline: utcDay(14),
    },
  });
  await prisma.job.create({
    data: {
      collegeId: c,
      companyId: acme.id,
      title: 'Java Backend Intern',
      requiredSkills: ['java', 'spring'],
      minCgpa: 6,
      allowedDepartments: [],
      deadline: utcDay(20),
    },
  });
  await prisma.placementDrive.create({
    data: {
      collegeId: c,
      jobId: job1.id,
      driveDate: new Date(Date.now() + 2 * 3600_000),
      venue: 'Seminar Hall',
      status: 'UPCOMING',
    },
  });

  // ── notices, events, complaints ────────────────────
  const adminUser = await prisma.user.findFirstOrThrow({ where: { collegeId: c, loginId: 'ADMIN001' } });
  await prisma.notice.createMany({
    data: [
      {
        collegeId: c,
        authorId: adminUser.id,
        title: 'Mid-semester results published',
        body: 'Mid-semester results for Semester 5 are available on the portal.',
        publishedAt: new Date(Date.now() - 14 * DAY),
      },
      {
        collegeId: c,
        authorId: hodUser,
        title: 'CSE: Department seminar',
        body: 'Guest lecture on database internals this Friday.',
        departmentId: dept.CSE,
        publishedAt: new Date(Date.now() - 1 * DAY),
      },
    ],
  });
  const club = await prisma.club.create({ data: { collegeId: c, name: 'Coding Club' } });
  await prisma.campusEvent.create({
    data: {
      collegeId: c,
      clubId: club.id,
      title: 'Hack Night',
      venue: 'Lab 3',
      startsAt: new Date(Date.now() + 7 * DAY),
    },
  });
  const sup = await prisma.user.findFirstOrThrow({ where: { collegeId: c, loginId: 'SUP001' } });
  const acct = await prisma.user.findFirstOrThrow({ where: { collegeId: c, loginId: 'ACC001' } });
  const mk = async (
    n: number,
    student: number,
    subject: string,
    description: string,
    over: Partial<Prisma.ComplaintUncheckedCreateInput> = {},
  ) => {
    const r = classifyComplaint(`${subject} ${description}`);
    return prisma.complaint.create({
      data: {
        collegeId: c,
        ticketNo: `GRV-2026-${String(n).padStart(5, '0')}`,
        complainantId: studentCse[student].userId,
        category: r.category,
        subject,
        description,
        priority: r.priority,
        status: 'ASSIGNED',
        slaDueAt: slaDueAt(r.priority),
        aiRouting: { ...r, source: 'rules' } as unknown as Prisma.InputJsonValue,
        ...over,
      },
    });
  };
  const c1 = await mk(1, 1, 'Scholarship not credited', 'My scholarship has not been credited since August', {
    assignedToId: acct.id,
    routedByAi: true,
  });
  await mk(2, 3, 'Wi-Fi not working in lab 3', 'Internet is down in lab 3 every afternoon', { assignedToId: sup.id });
  await mk(3, 5, 'Marked absent wrongly', 'Teacher marked me absent in DBMS on Tuesday although I attended', {
    assignedToId: hodUser,
    assignedDepartmentId: dept.CSE,
    slaDueAt: new Date(Date.now() - 6 * 3600_000),
    priority: 'HIGH',
    status: 'INVESTIGATING',
  });
  await prisma.complaintEvent.create({
    data: { complaintId: c1.id, actorId: studentCse[1].userId, type: 'CREATED', note: 'Auto-routed to accounts' },
  });

  // ── knowledge base (SAMPLE texts for RAG development) ──
  const mkDoc = async (
    title: string,
    documentType: Prisma.DocumentCreateInput['documentType'],
    visibility: Prisma.DocumentCreateInput['visibility'],
    pages: string[],
    extra: Partial<Prisma.DocumentUncheckedCreateInput> = {},
  ) => {
    const doc = await prisma.document.create({
      data: {
        collegeId: c,
        uploadedById: adminUser.id,
        title,
        documentType,
        visibility,
        academicYear: '2026-27',
        storageKey: 'seed/none',
        mimeType: 'text/plain',
        sizeBytes: pages.join('').length,
        checksumSha256: 'seed',
        status: 'READY',
        pageCount: pages.length,
        ...extra,
      },
    });
    await prisma.documentChunk.createMany({
      data: pages.map((content, i) => ({
        documentId: doc.id,
        collegeId: c,
        documentType,
        academicYear: '2026-27',
        visibility: doc.visibility,
        allowedRoleKeys: doc.allowedRoleKeys,
        departmentId: doc.departmentId,
        chunkIndex: i,
        pageNumber: i + 1,
        content,
        tokenCount: Math.ceil(content.length / 4),
      })),
    });
  };
  await mkDoc('SAMPLE Attendance Policy 2026-27', 'ATTENDANCE_POLICY', 'STUDENTS', [
    'SAMPLE TEXT FOR DEVELOPMENT — not a real college rule. Attendance is recorded for every lecture. A student must maintain a minimum of 75 percent attendance in each subject to be eligible to appear in the end semester examination.',
    'Students whose attendance is between 65 and 75 percent may apply for condonation of shortage to the Head of Department with a valid medical certificate or other documentary proof. Condonation may be allowed once per academic year on payment of the prescribed fee. Students below 65 percent attendance are detained from the examination.',
    'Attendance corrections: a teacher who has wrongly recorded attendance must submit a correction request. The Head of Department reviews and approves or rejects it, and every change is audited. Students who believe their attendance is wrong should raise a grievance with the date and subject.',
  ]);
  await mkDoc('SAMPLE Examination Rules 2026-27', 'EXAM_RULES', 'STUDENTS', [
    'SAMPLE TEXT FOR DEVELOPMENT. Students must carry their college identity card to every examination hall. Mobile phones and smart watches are not permitted in the examination hall. Students are expected to reach the hall 20 minutes before the start of the paper.',
    'Re-evaluation of the end semester answer script may be requested within 7 days of the result declaration by submitting the re-evaluation form and fee to the examination cell.',
  ]);
  await mkDoc('SAMPLE Scholarship Guidelines', 'SCHOLARSHIP', 'PUBLIC', [
    'SAMPLE TEXT FOR DEVELOPMENT. Applicants for college scholarships must submit the previous semester marksheet, a copy of the college identity card and a bank passbook copy. Applications are verified by the scholarship cell in the accounts office.',
  ]);
  await mkDoc(
    'SAMPLE CSE Department Lab Safety Manual',
    'DEPARTMENT',
    'DEPARTMENT',
    [
      'SAMPLE TEXT FOR DEVELOPMENT. CSE laboratories are open from 9 am to 5 pm. Food and drinks are not allowed in laboratories. Report any equipment fault to the lab assistant immediately.',
    ],
    { departmentId: dept.CSE },
  );
  await mkDoc('SAMPLE Faculty Service Rules and Salary Policy', 'OTHER', 'TEACHERS', [
    'SAMPLE TEXT FOR DEVELOPMENT. Faculty salary structure, increments and allowances are governed by these service rules. This document is visible to teachers only and must never be returned to students.',
  ]);
  await mkDoc('SAMPLE Governing Body Minutes', 'OTHER', 'ADMIN_ONLY', [
    'SAMPLE TEXT FOR DEVELOPMENT. Confidential governing body minutes visible to college administration only.',
  ]);
  await prisma.gradingScheme.create({
    data: {
      collegeId: c,
      name: '10-point scale',
      bands: [
        { min: 90, max: 100, grade: 'O', points: 10 },
        { min: 80, max: 89.99, grade: 'A+', points: 9 },
        { min: 70, max: 79.99, grade: 'A', points: 8 },
        { min: 60, max: 69.99, grade: 'B+', points: 7 },
        { min: 50, max: 59.99, grade: 'B', points: 6 },
        { min: 45, max: 49.99, grade: 'C', points: 5 },
        { min: 40, max: 44.99, grade: 'P', points: 4 },
        { min: 0, max: 39.99, grade: 'F', points: 0 },
      ],
      isDefault: true,
    },
  });

  console.log('\n✔ Seeded SDIET. Log in with { collegeCode: "SDIET", loginId, password: $SEED_PASSWORD }');
  console.log(
    '  Staff:    ADMIN001 (admin) · CSE-T01 (HOD+teacher) · CSE-T02..T05 (teachers) · CE-T01 (HOD) · ACC001 · EXAM001 · PLC001 · SUP001',
  );
  console.log('  Students: CSE23001..CSE23018, CE23001..003      Parent: PAR-CSE23001 (ward CSE23001)');
  console.log('  Platform: { loginId: "PLATFORM" } with no collegeCode (super admin)');
  console.log(
    '  Scenarios: CSE23003 & CSE23010 attendance shortage · CSE23005 sudden decline · CSE23007 borderline · overdue fees · escalated-ready complaint GRV-2026-00003',
  );
  console.log(
    '  Docs: sample policy texts are keyword-searchable immediately; upload real PDFs (POST /documents) to build embeddings.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
