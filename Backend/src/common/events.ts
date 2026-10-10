/** Domain event names + payloads. Modules react to these instead of calling each other. */
export const DomainEvents = {
  AttendanceUpdated: 'attendance.updated',
  AttendanceShortageDetected: 'attendance.shortage_detected',
  AttendanceCorrectionReviewed: 'attendance.correction_reviewed',
  AssignmentCreated: 'assignment.created',
  AssignmentDeadlineApproaching: 'assignment.deadline_approaching',
  ExamScheduled: 'exam.scheduled',
  ResultPublished: 'result.published',
  FeeDue: 'fee.due',
  ComplaintCreated: 'complaint.created',
  ComplaintEscalated: 'complaint.escalated',
  ComplaintStatusChanged: 'complaint.status_changed',
  ScholarshipDeadlineApproaching: 'scholarship.deadline_approaching',
  PlacementDriveCreated: 'placement.drive_created',
  NoticePublished: 'notice.published',
  RiskAssessed: 'risk.assessed',
  DocumentReady: 'document.ready',
} as const;

export interface AttendanceUpdatedEvent {
  collegeId: string;
  studentIds: string[];
  subjectId: string;
  actorId: string;
}
export interface AttendanceShortageEvent {
  collegeId: string;
  studentId: string;
  studentUserId: string;
  teacherUserIds: string[];
  parentUserIds: string[];
  subjectId?: string;
  percentage: number;
  threshold: number;
  classesNeeded: number | null;
  subjectName?: string;
}
export interface NotifyUsersEvent {
  collegeId: string;
  userIds: string[];
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
export const NOTIFY = 'notify.users';
