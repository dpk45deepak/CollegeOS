import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { AttendanceAnalyticsService } from '../attendance/attendance-analytics.service';
import { AttendanceService } from '../attendance/attendance.service';
import * as AD from '../attendance/dto/attendance.dto';
import { AssignmentsService } from '../assignments/assignments.service';
import * as ASD from '../assignments/dto/assignments.dto';
import { CampusService } from '../campus/campus.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Principal } from '../common/types/principal';
import { ComplaintsService } from '../complaints/complaints.service';
import { ExaminationsService } from '../examinations/examinations.service';
import { FeesService } from '../fees/fees.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlacementsService } from '../placements/placements.service';
import { RiskService } from '../analytics/risk.service';
import { ScholarshipsService } from '../scholarships/scholarships.service';
import { TimetableService } from '../timetable/timetable.service';

const page = (limit: number) => Object.assign(new PaginationQueryDto(), { page: 1, limit });

/** Student (and parent) dashboard: one call aggregates every module the student cares about. */
@Injectable()
export class PortalService {
  private readonly logger = new Logger(PortalService.name);
  constructor(
    private readonly attendance: AttendanceAnalyticsService,
    private readonly attendanceSvc: AttendanceService,
    private readonly timetable: TimetableService,
    private readonly assignments: AssignmentsService,
    private readonly exams: ExaminationsService,
    private readonly fees: FeesService,
    private readonly scholarships: ScholarshipsService,
    private readonly placements: PlacementsService,
    private readonly complaints: ComplaintsService,
    private readonly campus: CampusService,
    private readonly notifications: NotificationsService,
    private readonly risk: RiskService,
  ) {}

  /** Student → self. Parent → one of their wards. Anyone else → 403. */
  studentId(p: Principal, requested?: string): string {
    if (p.studentId) return p.studentId;
    if (requested && p.guardianOfStudentIds.includes(requested)) return requested;
    if (p.guardianOfStudentIds.length === 1) return p.guardianOfStudentIds[0];
    throw new ForbiddenException('Student account (or ward id for parents) required');
  }
  private as(p: Principal, studentId: string): Principal {
    return { ...p, studentId };
  }

  attendanceReport(c: string, id: string) {
    return this.attendance.report(c, id);
  }
  attendanceRecords(c: string, id: string, q: AD.AttendanceQueryDto) {
    return this.attendanceSvc.studentRecords(c, id, q);
  }
  timetableFor(c: string, id: string) {
    return this.timetable.forStudent(c, id);
  }
  assignmentsFor(c: string, id: string, q: ASD.AssignmentListQueryDto) {
    return this.assignments.listForStudent(c, id, q);
  }
  examsFor(c: string, id: string) {
    return this.exams.upcomingForStudent(c, id, 120);
  }
  resultsFor(c: string, id: string) {
    return this.exams.studentResults(c, id);
  }
  feesFor(c: string, id: string) {
    return this.fees.forStudent(c, id);
  }

  async dashboard(p: Principal, c: string, id: string) {
    const sp = this.as(p, id);
    const safe = async <T>(name: string, fn: () => Promise<T>): Promise<T | { error: string }> => {
      try {
        return await fn();
      } catch (e) {
        this.logger.warn(`dashboard section ${name} failed: ${(e as Error).message}`);
        return { error: 'unavailable' };
      }
    };
    const today = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' })
      .format(new Date())
      .slice(0, 3)
      .toUpperCase();
    const [attendance, tt, asg, exams, fees, notices, events, jobs, scholarships, complaints, risk, unread] =
      await Promise.all([
        safe('attendance', () =>
          this.attendance
            .report(c, id)
            .then((r) => ({
              overall: r.overall,
              threshold: r.threshold,
              flags: r.flags,
              worstSubjects: r.subjects.slice(0, 3),
            })),
        ),
        safe('timetable', () => this.timetable.forStudent(c, id).then((s) => s.filter((x) => x.dayOfWeek === today))),
        safe('assignments', () =>
          this.assignments.listForStudent(c, id, Object.assign(page(5), { pending: 'true' })).then((r) => r.data),
        ),
        safe('exams', () => this.exams.upcomingForStudent(c, id, 30).then((r) => r.slice(0, 3))),
        safe('fees', () =>
          this.fees
            .forStudent(c, id)
            .then((r) => ({
              outstanding: r.reduce((s, f) => s + f.outstanding, 0),
              next: r.find((f) => f.outstanding > 0)?.dueDate ?? null,
            })),
        ),
        safe('notices', () => this.campus.listNotices(p, c, page(3)).then((r) => r.data)),
        safe('events', () => this.campus.listEvents(c, page(3)).then((r) => r.data)),
        safe('placements', () =>
          this.placements
            .recommendations(sp, c)
            .then((r) =>
              r
                .slice(0, 3)
                .map(({ job, match }) => ({
                  jobId: job.id,
                  title: job.title,
                  company: job.company.name,
                  compatibility: match.score,
                  eligible: match.eligible,
                })),
            ),
        ),
        safe('scholarships', () => this.scholarships.matchesForStudent(sp, c).then((r) => ({ possible: r.length }))),
        safe('complaints', () =>
          this.complaints
            .mine(p, c, page(50))
            .then((r) => ({ open: r.data.filter((x) => x.status !== 'CLOSED').length })),
        ),
        safe('risk', () =>
          this.risk
            .assess(c, id, false)
            .then((r) => ({ level: r.level, reasons: r.reasons, confidence: r.confidence })),
        ),
        safe('unread', () => this.notifications.unreadCount(p.userId)),
      ]);
    return {
      studentId: id,
      attendance,
      todaysClasses: tt,
      assignmentsDue: asg,
      upcomingExams: exams,
      fees,
      notices,
      events,
      placementMatches: jobs,
      scholarships,
      complaints,
      academicInsight: risk,
      unreadNotifications: unread,
    };
  }
}
