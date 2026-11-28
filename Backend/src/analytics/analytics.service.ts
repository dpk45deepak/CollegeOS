import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isAdmin } from '../access/access.service';
import { ROLE } from '../auth/permissions';
import { Principal } from '../common/types/principal';
import { PrismaService } from '../prisma/prisma.service';

const num = (v: unknown) => (v === null || v === undefined ? null : Math.round(Number(v) * 100) / 100);

/** Department scope: admins see the whole college, HODs their departments. Non-admin non-HODs are scoped to their departments or restricted. */
export function scopeDepartments(p: Principal): string[] | undefined {
  if (isAdmin(p)) return undefined;
  if (p.roleKeys.includes(ROLE.HOD) && p.departmentIds.length) return p.departmentIds;
  return p.departmentIds.length ? p.departmentIds : ['__none__'];
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private studentSql(deps?: string[]) {
    return deps
      ? Prisma.sql`AND "studentId" IN (SELECT id FROM "Student" WHERE "departmentId" = ANY(${deps}::text[]))`
      : Prisma.empty;
  }
  private studentWhere(c: string, deps?: string[]): Prisma.StudentWhereInput {
    return { collegeId: c, ...(deps ? { departmentId: { in: deps } } : {}) };
  }

  /** Headline KPIs — all computed with grouped SQL / count queries, no per-row loops. */
  async overview(c: string, deps?: string[]) {
    const scope = this.studentSql(deps);
    const college = await this.prisma.college.findUniqueOrThrow({
      where: { id: c },
      select: { attendanceThreshold: true },
    });
    const threshold = Number(college.attendanceThreshold);
    const [students, att, shortage, pass, cgpa, asg, fees, placed, complaints, schol] = await Promise.all([
      this.prisma.student.count({ where: this.studentWhere(c, deps) }),
      this.prisma.$queryRaw<{ pct: number | null }[]>(
        Prisma.sql`SELECT 100.0 * SUM(CASE WHEN status IN ('PRESENT','LATE') THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0) AS pct FROM "Attendance" WHERE "collegeId" = ${c} ${scope}`,
      ),
      this.prisma.$queryRaw<{ n: bigint }[]>(
        Prisma.sql`SELECT COUNT(*)::bigint AS n FROM (SELECT "studentId" FROM "Attendance" WHERE "collegeId" = ${c} ${scope} GROUP BY "studentId" HAVING 100.0 * SUM(CASE WHEN status IN ('PRESENT','LATE') THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0) < ${threshold}) t`,
      ),
      this.prisma.$queryRaw<{ pct: number | null }[]>(
        Prisma.sql`SELECT 100.0 * SUM(CASE WHEN r."marksObtained" >= x."passMarks" THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0) AS pct FROM "ExamResult" r JOIN "Exam" x ON x.id = r."examId" WHERE r."collegeId" = ${c} AND r.status = 'PUBLISHED' ${deps ? Prisma.sql`AND r."studentId" IN (SELECT id FROM "Student" WHERE "departmentId" = ANY(${deps}::text[]))` : Prisma.empty}`,
      ),
      this.prisma.student.aggregate({
        where: { ...this.studentWhere(c, deps), cgpa: { not: null } },
        _avg: { cgpa: true },
      }),
      this.prisma.$queryRaw<{ pct: number | null }[]>(
        Prisma.sql`SELECT 100.0 * COUNT(s.id) / NULLIF(COUNT(*),0) AS pct FROM "Enrollment" e JOIN "Assignment" a ON a."subjectOfferingId" = e."subjectOfferingId" AND a."dueAt" < now() LEFT JOIN "Submission" s ON s."assignmentId" = a.id AND s."studentId" = e."studentId" WHERE e."collegeId" = ${c} ${deps ? Prisma.sql`AND e."studentId" IN (SELECT id FROM "Student" WHERE "departmentId" = ANY(${deps}::text[]))` : Prisma.empty}`,
      ),
      this.prisma.$queryRaw<{ due: number | null; paid: number | null }[]>(
        Prisma.sql`SELECT SUM("amountDue" - "discount" - "scholarshipAdjustment") AS due, SUM("amountPaid") AS paid FROM "StudentFee" WHERE "collegeId" = ${c} ${scope}`,
      ),
      this.prisma.jobApplication.findMany({
        where: { collegeId: c, status: { in: ['OFFERED', 'ACCEPTED'] }, student: this.studentWhere(c, deps) },
        distinct: ['studentId'],
        select: { studentId: true },
      }),
      this.prisma.$queryRaw<{ hours: number | null; resolved: bigint; total: bigint }[]>(
        Prisma.sql`SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600) AS hours, COUNT("resolvedAt")::bigint AS resolved, COUNT(*)::bigint AS total FROM "Complaint" WHERE "collegeId" = ${c} ${deps ? Prisma.sql`AND "assignedDepartmentId" = ANY(${deps}::text[])` : Prisma.empty}`,
      ),
      this.prisma.scholarshipApplication.findMany({
        where: {
          scholarship: { collegeId: c },
          status: { in: ['APPLIED', 'APPROVED', 'DISBURSED'] },
          student: this.studentWhere(c, deps),
        },
        distinct: ['studentId'],
        select: { studentId: true },
      }),
    ]);
    const due = Number(fees[0]?.due ?? 0),
      paid = Number(fees[0]?.paid ?? 0);
    return {
      students,
      attendancePercentage: num(att[0]?.pct),
      attendanceThreshold: threshold,
      studentsBelowThreshold: Number(shortage[0]?.n ?? 0),
      passPercentage: num(pass[0]?.pct),
      averageCgpa: num(cgpa._avg.cgpa),
      assignmentCompletionPercentage: num(asg[0]?.pct),
      feeCollection: {
        totalDue: due,
        collected: paid,
        outstanding: Math.max(0, due - paid),
        collectionRatePct: due ? num((paid / due) * 100) : null,
      },
      placementRatePct: students ? num((placed.length / students) * 100) : null,
      studentsPlaced: placed.length,
      complaints: {
        total: Number(complaints[0]?.total ?? 0),
        resolved: Number(complaints[0]?.resolved ?? 0),
        avgResolutionHours: num(complaints[0]?.hours),
      },
      scholarshipParticipationPct: students ? num((schol.length / students) * 100) : null,
    };
  }

  attendanceTrend(c: string, days = 30, deps?: string[]) {
    const scope = this.studentSql(deps);
    return this.prisma.$queryRaw<{ date: Date; pct: number }[]>(
      Prisma.sql`SELECT date, ROUND((100.0 * SUM(CASE WHEN status IN ('PRESENT','LATE') THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0))::numeric, 2)::float AS pct FROM "Attendance" WHERE "collegeId" = ${c} ${scope} AND date >= now() - make_interval(days => ${days}) GROUP BY date ORDER BY date`,
    );
  }
  departmentBreakdown(c: string, deps?: string[]) {
    const deptScope = deps && deps.length
      ? Prisma.sql`AND d.id = ANY(${deps}::text[])`
      : Prisma.empty;
    return this.prisma.$queryRaw<
      { department: string; students: number; attendancePct: number | null; avgCgpa: number | null }[]
    >(Prisma.sql`
      SELECT d.code AS department, COUNT(DISTINCT s.id)::int AS students,
             ROUND((100.0 * SUM(CASE WHEN a.status IN ('PRESENT','LATE') THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0))::numeric, 2)::float AS "attendancePct",
             ROUND(AVG(s.cgpa)::numeric, 2)::float AS "avgCgpa"
      FROM "Department" d LEFT JOIN "Student" s ON s."departmentId" = d.id LEFT JOIN "Attendance" a ON a."studentId" = s.id
      WHERE d."collegeId" = ${c} ${deptScope} GROUP BY d.code ORDER BY d.code`);
  }

  /**
   * "What needs attention today?" — actionable, quantified items instead of static numbers.
   * Each item carries a severity, a count and the API to act on.
   */
  async attention(p: Principal, c: string) {
    const deps = scopeDepartments(p);
    const now = new Date();
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const in48h = new Date(now.getTime() + 48 * 3_600_000);
    const sw = this.studentWhere(c, deps);
    const [
      overview,
      highComplaints,
      slaBreached,
      overdueFees,
      drivesToday,
      jobsClosing,
      deadlines,
      corrections,
      drafts,
      highRisk,
      failedDocs,
      schol,
    ] = await Promise.all([
      this.overview(c, deps),
      this.prisma.complaint.count({
        where: {
          collegeId: c,
          priority: { in: ['HIGH', 'CRITICAL'] },
          status: { in: ['OPEN', 'ASSIGNED', 'INVESTIGATING', 'ESCALATED', 'REOPENED'] },
          ...(deps ? { assignedDepartmentId: { in: deps } } : {}),
        },
      }),
      this.prisma.complaint.count({
        where: {
          collegeId: c,
          status: { in: ['OPEN', 'ASSIGNED', 'INVESTIGATING', 'REOPENED', 'ESCALATED'] },
          slaDueAt: { lt: now },
          ...(deps ? { assignedDepartmentId: { in: deps } } : {}),
        },
      }),
      this.prisma.studentFee.findMany({
        where: { collegeId: c, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }, dueDate: { lt: now }, student: sw },
        select: { amountDue: true, discount: true, scholarshipAdjustment: true, amountPaid: true },
      }),
      deps
        ? Promise.resolve(0)
        : this.prisma.placementDrive.count({
            where: {
              collegeId: c,
              driveDate: {
                gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
                lt: endOfDay,
              },
              status: { not: 'CANCELLED' },
            },
          }),
      deps
        ? Promise.resolve(0)
        : this.prisma.job.count({ where: { collegeId: c, deadline: { gte: now, lt: endOfDay } } }),
      this.prisma.$queryRaw<{ n: bigint }[]>(
        Prisma.sql`SELECT COUNT(DISTINCT e."studentId")::bigint AS n FROM "Enrollment" e JOIN "Assignment" a ON a."subjectOfferingId" = e."subjectOfferingId" AND a."dueAt" BETWEEN ${now} AND ${in48h} LEFT JOIN "Submission" s ON s."assignmentId" = a.id AND s."studentId" = e."studentId" WHERE e."collegeId" = ${c} AND s.id IS NULL ${deps ? Prisma.sql`AND e."studentId" IN (SELECT id FROM "Student" WHERE "departmentId" = ANY(${deps}::text[]))` : Prisma.empty}`,
      ),
      this.prisma.attendanceCorrection.count({
        where: {
          collegeId: c,
          status: 'PENDING',
          ...(deps
            ? { attendance: { session: { subjectOffering: { subject: { departmentId: { in: deps } } } } } }
            : {}),
        },
      }),
      this.prisma.examResult.groupBy({
        by: ['examId'],
        where: {
          collegeId: c,
          status: 'DRAFT',
          ...(deps ? { exam: { subjectOffering: { subject: { departmentId: { in: deps } } } } } : {}),
        },
      }),
      this.prisma.$queryRaw<{ n: bigint }[]>(
        Prisma.sql`SELECT COUNT(*)::bigint AS n FROM (SELECT DISTINCT ON ("studentId") "studentId", level FROM "AcademicRiskAssessment" WHERE "collegeId" = ${c} ${this.studentSql(deps)} ORDER BY "studentId", "computedAt" DESC) t WHERE level = 'HIGH'`,
      ),
      this.prisma.document.count({
        where: {
          collegeId: c,
          status: 'FAILED',
          ...(deps ? { departmentId: { in: deps } } : {}),
        },
      }),
      deps
        ? Promise.resolve(0)
        : this.prisma.scholarship.count({
            where: { collegeId: c, isActive: true, deadline: { gte: now, lt: new Date(now.getTime() + 3 * 86_400_000) } },
          }),
    ]);
    const pending = overdueFees.reduce(
      (s, f) =>
        s +
        Math.max(0, Number(f.amountDue) - Number(f.discount) - Number(f.scholarshipAdjustment) - Number(f.amountPaid)),
      0,
    );
    type Sev = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
    const items: { key: string; severity: Sev; count: number; message: string; action: string }[] = [];
    const add = (key: string, severity: Sev, count: number, message: string, action: string) => {
      if (count > 0) items.push({ key, severity, count, message, action });
    };
    add(
      'attendance_shortage',
      'HIGH',
      overview.studentsBelowThreshold,
      `${overview.studentsBelowThreshold} students are below the ${overview.attendanceThreshold}% attendance threshold`,
      'GET /api/v1/attendance/analytics/shortage',
    );
    add(
      'complaints_high',
      'CRITICAL',
      highComplaints,
      `${highComplaints} unresolved high-priority complaints`,
      'GET /api/v1/complaints?priority=HIGH',
    );
    add(
      'complaints_sla',
      'CRITICAL',
      slaBreached,
      `${slaBreached} complaints have breached their SLA`,
      'GET /api/v1/complaints?status=ESCALATED',
    );
    add(
      'fees_overdue',
      'HIGH',
      overdueFees.length,
      `₹${Math.round(pending).toLocaleString('en-IN')} overdue across ${overdueFees.length} fee records`,
      'GET /api/v1/fees?status=OVERDUE',
    );
    add(
      'placement_drives_today',
      'MEDIUM',
      drivesToday,
      `${drivesToday} placement drive(s) happening today`,
      'GET /api/v1/placements/drives',
    );
    add(
      'placement_jobs_closing',
      'MEDIUM',
      jobsClosing,
      `${jobsClosing} job application window(s) close today`,
      'GET /api/v1/placements/jobs',
    );
    add(
      'assignment_deadlines',
      'MEDIUM',
      Number(deadlines[0]?.n ?? 0),
      `${Number(deadlines[0]?.n ?? 0)} students have unsubmitted assignments due within 48 hours`,
      'GET /api/v1/assignments',
    );
    add(
      'attendance_corrections',
      'MEDIUM',
      corrections,
      `${corrections} attendance corrections awaiting review`,
      'GET /api/v1/attendance/corrections?status=PENDING',
    );
    add(
      'results_unpublished',
      'MEDIUM',
      drafts.length,
      `${drafts.length} exam(s) have draft results not yet published`,
      'POST /api/v1/exams/:id/publish',
    );
    add(
      'students_high_risk',
      'HIGH',
      Number(highRisk[0]?.n ?? 0),
      `${Number(highRisk[0]?.n ?? 0)} students currently have a HIGH academic-risk indicator (estimate)`,
      'GET /api/v1/analytics/risk',
    );
    add(
      'documents_failed',
      'INFO',
      failedDocs,
      `${failedDocs} knowledge document(s) failed processing`,
      'GET /api/v1/documents?status=FAILED',
    );
    add(
      'scholarship_deadlines',
      'MEDIUM',
      schol,
      `${schol} scholarship deadline(s) within 3 days`,
      'GET /api/v1/scholarships',
    );
    const rank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, INFO: 3 };
    return {
      generatedAt: now.toISOString(),
      scope: deps ? 'department' : 'college',
      items: items.sort((a, b) => rank[a.severity] - rank[b.severity] || b.count - a.count),
    };
  }

  /** Latest risk level per student in scope, for HOD/admin. Reasons are included — they are why the flag exists. */
  async riskList(p: Principal, c: string, level: 'MEDIUM' | 'HIGH' = 'HIGH', limit = 50) {
    const deps = scopeDepartments(p);
    const rows = await this.prisma.$queryRaw<
      { studentId: string; level: string; score: number; reasons: string[]; computedAt: Date }[]
    >(Prisma.sql`
      SELECT * FROM (SELECT DISTINCT ON ("studentId") "studentId", level::text, score::float, reasons, "computedAt" FROM "AcademicRiskAssessment"
        WHERE "collegeId" = ${c} ${this.studentSql(deps)} ORDER BY "studentId", "computedAt" DESC) t
      WHERE level = ANY(${level === 'HIGH' ? ['HIGH'] : ['MEDIUM', 'HIGH']}::text[]) ORDER BY score DESC LIMIT ${limit}`);
    const students = await this.prisma.student.findMany({
      where: { id: { in: rows.map((r) => r.studentId) } },
      select: {
        id: true,
        rollNumber: true,
        user: { select: { firstName: true, lastName: true } },
        department: { select: { code: true } },
      },
    });
    const by = new Map(students.map((s) => [s.id, s]));
    return {
      note: 'Indicators are estimates based on past data, not guarantees. Use them to offer support.',
      students: rows.map((r) => ({ ...r, student: by.get(r.studentId) })),
    };
  }

  private resolveScopeDeps(p: Principal, departmentId?: string): string[] | undefined {
    if (isAdmin(p)) return departmentId ? [departmentId] : undefined;
    const allowed = scopeDepartments(p) ?? [];
    if (departmentId) {
      if (!allowed.includes(departmentId)) {
        throw new ForbiddenException('Requested department is outside your scope');
      }
      return [departmentId];
    }
    return allowed;
  }

  /** Department-scoped operational & academic telemetry for HOD / Admin consoles. */
  async hodDepartment(p: Principal, c: string, departmentId?: string) {
    const deps = this.resolveScopeDeps(p, departmentId);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);

    const [departments, overview, teachers, passRows, pendingCorrections, pendingLeaves, subjectCount] = await Promise.all([
      this.prisma.department.findMany({
        where: { collegeId: c, ...(deps ? { id: { in: deps } } : {}) },
        select: { id: true, code: true, name: true },
        orderBy: { code: 'asc' },
      }),
      this.overview(c, deps),
      this.prisma.teacher.findMany({
        where: { collegeId: c, ...(deps ? { departmentId: { in: deps } } : {}) },
        include: {
          user: { select: { firstName: true, lastName: true, loginId: true } },
          department: { select: { id: true, code: true } },
          subjectOfferings: {
            include: {
              timetableSlots: {
                where: { validFrom: { lte: now }, OR: [{ validTo: null }, { validTo: { gte: now } }] },
                select: { startMinute: true, endMinute: true },
              },
              attendanceSessions: {
                where: { date: { gte: thirtyDaysAgo } },
                select: { id: true },
              },
            },
          },
        },
        orderBy: { employeeId: 'asc' },
      }),
      this.prisma.$queryRaw<
        {
          subjectId: string;
          subjectCode: string;
          subjectName: string;
          evaluated: bigint;
          passed: bigint;
          avgScorePct: number | null;
        }[]
      >(Prisma.sql`
        SELECT sub.id AS "subjectId",
               sub.code AS "subjectCode",
               sub.name AS "subjectName",
               COUNT(r.id)::bigint AS evaluated,
               SUM(CASE WHEN r."marksObtained" >= x."passMarks" THEN 1 ELSE 0 END)::bigint AS passed,
               ROUND(AVG(100.0 * r."marksObtained" / NULLIF(x."maxMarks", 0))::numeric, 1)::float AS "avgScorePct"
        FROM "ExamResult" r
        JOIN "Exam" x ON x.id = r."examId"
        JOIN "SubjectOffering" so ON so.id = x."subjectOfferingId"
        JOIN "Subject" sub ON sub.id = so."subjectId"
        WHERE r."collegeId" = ${c}
          AND r.status = 'PUBLISHED'
          ${deps ? Prisma.sql`AND sub."departmentId" = ANY(${deps}::text[])` : Prisma.empty}
        GROUP BY sub.id, sub.code, sub.name
        ORDER BY sub.code
      `),
      this.prisma.attendanceCorrection.count({
        where: {
          collegeId: c,
          status: 'PENDING',
          ...(deps
            ? { attendance: { session: { subjectOffering: { subject: { departmentId: { in: deps } } } } } }
            : {}),
        },
      }),
      this.prisma.leaveRequest.count({
        where: {
          status: 'PENDING',
          teacher: { collegeId: c, ...(deps ? { departmentId: { in: deps } } : {}) },
        },
      }),
      this.prisma.subject.count({
        where: { collegeId: c, ...(deps ? { departmentId: { in: deps } } : {}) },
      }),
    ]);

    const facultyWorkloadHours = teachers.map((t) => {
      const weeklyMinutes = t.subjectOfferings.reduce(
        (acc, off) => acc + off.timetableSlots.reduce((s, slot) => s + Math.max(0, slot.endMinute - slot.startMinute), 0),
        0,
      );
      const sessionsLast30Days = t.subjectOfferings.reduce((acc, off) => acc + off.attendanceSessions.length, 0);
      return {
        teacherId: t.id,
        employeeId: t.employeeId,
        name: `${t.user.firstName} ${t.user.lastName}`.trim() || t.user.loginId,
        departmentCode: t.department.code,
        offeringsCount: t.subjectOfferings.length,
        weeklyHours: Math.round((weeklyMinutes / 60) * 10) / 10,
        sessionsLast30Days,
      };
    });

    const subjectPassRates = passRows.map((row) => {
      const evaluated = Number(row.evaluated);
      const passed = Number(row.passed);
      return {
        subjectId: row.subjectId,
        subjectCode: row.subjectCode,
        subjectName: row.subjectName,
        studentsEvaluated: evaluated,
        passedCount: passed,
        passPercentage: evaluated > 0 ? Math.round((passed / evaluated) * 1000) / 10 : null,
        avgScorePct: row.avgScorePct,
      };
    });

    return {
      departments,
      facultyCount: teachers.length,
      subjectCount,
      pendingCorrectionsCount: pendingCorrections,
      pendingLeaveRequestsCount: pendingLeaves,
      overview,
      facultyWorkloadHours,
      subjectPassRates,
    };
  }

  /** Institutional executive telemetry for Principal / Admin dashboards with deterministic, explainable insights. */
  async executive(p: Principal, c: string, departmentId?: string) {
    const deps = this.resolveScopeDeps(p, departmentId);
    const now = new Date();
    const sw = this.studentWhere(c, deps);

    const [overview, departmentComparison, batches, cgpaBuckets, totalJobs, openJobs, drives, apps, offers, acceptedOffers, avgOfferCtc, slaBreached] =
      await Promise.all([
        this.overview(c, deps),
        this.departmentBreakdown(c, deps),
        this.prisma.batch.findMany({
          where: { collegeId: c, ...(deps ? { departmentId: { in: deps } } : {}) },
          select: { id: true, name: true, startYear: true, _count: { select: { students: true } } },
          orderBy: { startYear: 'asc' },
        }),
        this.prisma.$queryRaw<{ bucket: string; count: bigint }[]>(Prisma.sql`
          SELECT CASE
            WHEN cgpa >= 9.0 THEN '9.0+'
            WHEN cgpa >= 8.0 THEN '8.0-8.9'
            WHEN cgpa >= 7.0 THEN '7.0-7.9'
            WHEN cgpa >= 6.0 THEN '6.0-6.9'
            ELSE '<6.0'
          END AS bucket,
          COUNT(*)::bigint AS count
          FROM "Student"
          WHERE "collegeId" = ${c} AND cgpa IS NOT NULL ${deps ? Prisma.sql`AND "departmentId" = ANY(${deps}::text[])` : Prisma.empty}
          GROUP BY 1
        `),
        this.prisma.job.count({ where: { collegeId: c } }),
        this.prisma.job.count({ where: { collegeId: c, OR: [{ deadline: null }, { deadline: { gte: now } }] } }),
        this.prisma.placementDrive.count({ where: { collegeId: c } }),
        this.prisma.jobApplication.count({ where: { collegeId: c, student: sw } }),
        this.prisma.offer.count({ where: { application: { collegeId: c, student: sw } } }),
        this.prisma.offer.count({ where: { status: 'ACCEPTED', application: { collegeId: c, student: sw } } }),
        this.prisma.offer.aggregate({
          where: { application: { collegeId: c, student: sw } },
          _avg: { ctc: true },
        }),
        this.prisma.complaint.count({
          where: {
            collegeId: c,
            status: { in: ['OPEN', 'ASSIGNED', 'INVESTIGATING', 'REOPENED', 'ESCALATED'] },
            slaDueAt: { lt: now },
            ...(deps ? { assignedDepartmentId: { in: deps } } : {}),
          },
        }),
      ]);

    const enrollmentByYear = new Map<number, { label: string; startYear: number; students: number }>();
    for (const b of batches) {
      const prev = enrollmentByYear.get(b.startYear);
      if (prev) prev.students += b._count.students;
      else enrollmentByYear.set(b.startYear, { label: String(b.startYear), startYear: b.startYear, students: b._count.students });
    }
    const enrollmentTrend = [...enrollmentByYear.values()].sort((a, b) => a.startYear - b.startYear);

    const bucketOrder = ['<6.0', '6.0-6.9', '7.0-7.9', '8.0-8.9', '9.0+'];
    const bucketMap = new Map(cgpaBuckets.map((b) => [b.bucket, Number(b.count)]));
    const cgpaDistribution = bucketOrder.map((range) => ({ range, count: bucketMap.get(range) ?? 0 }));

    const placementStats = {
      totalJobs,
      openJobs,
      drivesCount: drives,
      applicationsCount: apps,
      offersIssued: offers,
      offersAccepted: acceptedOffers,
      averageCtc: num(avgOfferCtc._avg.ctc),
      placementRatePct: overview.placementRatePct,
    };

    const insights: Array<{
      id: string;
      title: string;
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
      metricValue: string;
      summary: string;
      dataUsed: string;
      period: string;
      basis: 'DETERMINISTIC';
      recommendedAction: string;
    }> = [];

    if (overview.students > 0 && overview.studentsBelowThreshold > 0) {
      const shortagePct = Math.round((overview.studentsBelowThreshold / overview.students) * 1000) / 10;
      insights.push({
        id: 'attendance_shortage_risk',
        title: 'Attendance Threshold Risk',
        severity: shortagePct >= 20 ? 'HIGH' : 'MEDIUM',
        metricValue: `${overview.studentsBelowThreshold} / ${overview.students} (${shortagePct}%)`,
        summary: `${overview.studentsBelowThreshold} students are below the institutional ${overview.attendanceThreshold}% attendance threshold.`,
        dataUsed: 'Attendance records grouped per student vs College.attendanceThreshold',
        period: 'Current active semester',
        basis: 'DETERMINISTIC',
        recommendedAction: 'Trigger HOD shortage counseling & parent notifications for critical sections.',
      });
    }
    if (overview.feeCollection.totalDue > 0 && (overview.feeCollection.collectionRatePct ?? 100) < 85) {
      insights.push({
        id: 'fee_collection_gap',
        title: 'Fee Recovery Gap',
        severity: 'MEDIUM',
        metricValue: `${overview.feeCollection.collectionRatePct ?? 0}% collected`,
        summary: `₹${Math.round(overview.feeCollection.outstanding).toLocaleString('en-IN')} remains outstanding across active student fee ledgers.`,
        dataUsed: 'StudentFee.amountDue - discount - scholarshipAdjustment vs amountPaid',
        period: 'Active billing cycle',
        basis: 'DETERMINISTIC',
        recommendedAction: 'Review overdue ledger accounts and send due-fee reminders via Accountant console.',
      });
    }
    if (slaBreached > 0) {
      insights.push({
        id: 'complaint_sla_breach',
        title: 'Grievance SLA Breaches',
        severity: 'CRITICAL',
        metricValue: `${slaBreached} overdue`,
        summary: `${slaBreached} open grievance tickets have crossed their SLA resolution deadline.`,
        dataUsed: 'Open Complaint records with slaDueAt < current timestamp',
        period: 'As of today',
        basis: 'DETERMINISTIC',
        recommendedAction: 'Escalate unresolved tickets to respective department HODs or support assignees.',
      });
    }

    return {
      generatedAt: now.toISOString(),
      scope: deps ? 'department' : 'college',
      overview,
      departmentComparison,
      enrollmentTrend,
      cgpaDistribution,
      placementStats,
      insights,
    };
  }
}
