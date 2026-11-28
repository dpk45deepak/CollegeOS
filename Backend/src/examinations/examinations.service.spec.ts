import { AccessService } from '../access/access.service';
import { ROLE } from '../auth/permissions';
import { Principal } from '../common/types/principal';
import { ExaminationsService } from './examinations.service';

const examControllerPrincipal: Principal = {
  userId: 'ec1',
  collegeId: 'c1',
  sessionId: 's1',
  roleKeys: [ROLE.EXAM_CONTROLLER],
  permissions: [],
  departmentIds: [],
  guardianOfStudentIds: [],
  isSuperAdmin: false,
};

describe('ExaminationsService queries', () => {
  it('list() selects subjectOffering section & semester alongside room code', async () => {
    const findMany = jest.fn(async (_args: Record<string, unknown>) => []);
    const prisma = { exam: { findMany, count: jest.fn(async () => 0) } };
    const svc = new ExaminationsService(
      prisma as never,
      new AccessService(prisma as never),
      { assert: jest.fn(async () => undefined) } as never,
      {} as never,
      { emit: jest.fn() } as never,
    );

    await svc.list(examControllerPrincipal, 'c1', { page: 1, limit: 20 });
    const offeringSelect = (
      findMany.mock.calls[0][0].include as { subjectOffering: { select: Record<string, unknown> } }
    ).subjectOffering.select;
    expect(offeringSelect).toHaveProperty('section');
    expect(offeringSelect).toHaveProperty('semester');
  });

  it('studentResults() includes semester.academicYear and computes passed/percentage', async () => {
    const prisma = {
      examResult: {
        findMany: jest.fn(async () => [
          {
            marksObtained: 78,
            grade: 'A',
            gradePoints: 8,
            publishedAt: new Date(),
            exam: {
              id: 'e1',
              title: 'End Sem Dec',
              type: 'END_SEM',
              maxMarks: 100,
              passMarks: 40,
              scheduledAt: new Date(),
              subjectOffering: {
                subject: { id: 'sub1', name: 'DBMS', code: 'CS302', credits: 4 },
                semester: { number: 5, academicYear: '2026-27' },
              },
            },
          },
        ]),
      },
    };
    const svc = new ExaminationsService(
      prisma as never,
      new AccessService(prisma as never),
      { assert: jest.fn(async () => undefined) } as never,
      {} as never,
      { emit: jest.fn() } as never,
    );

    const out = await svc.studentResults('c1', 'stu1');
    expect(out[0].passed).toBe(true);
    expect(out[0].percentage).toBe(78);
    expect((out[0].exam.subjectOffering.semester as { academicYear?: string }).academicYear).toBe('2026-27');
  });
});
