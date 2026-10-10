import { NotificationChannel } from '@prisma/client';

/** Which external channels (besides in-app) each event type uses. Kept data-driven and testable. */
const POLICY: Record<string, { external: ('EMAIL' | 'PUSH' | 'WHATSAPP')[]; parentWhatsApp?: boolean }> = {
  AttendanceShortageDetected: { external: ['EMAIL', 'PUSH'], parentWhatsApp: true },
  FeeDue: { external: ['EMAIL', 'PUSH'], parentWhatsApp: true },
  ResultPublished: { external: ['EMAIL', 'PUSH'], parentWhatsApp: true },
  ExamScheduled: { external: ['EMAIL', 'PUSH'] },
  ComplaintEscalated: { external: ['EMAIL', 'PUSH'] },
  ComplaintAssigned: { external: ['EMAIL', 'PUSH'] },
  AssignmentDeadlineApproaching: { external: ['PUSH'] },
  ScholarshipDeadlineApproaching: { external: ['EMAIL', 'PUSH'] },
  PlacementDriveCreated: { external: ['EMAIL', 'PUSH'] },
  NoticePublished: { external: ['PUSH'] },
};

export function externalChannels(type: string, isParent: boolean): ('EMAIL' | 'PUSH' | 'WHATSAPP')[] {
  const p = POLICY[type];
  if (!p) return [];
  const list = [...p.external];
  if (isParent && p.parentWhatsApp) list.push('WHATSAPP');
  return list;
}
export const IN_APP: NotificationChannel = 'IN_APP';
