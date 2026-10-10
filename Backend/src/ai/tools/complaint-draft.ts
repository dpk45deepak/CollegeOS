import { ComplaintCategory } from '@prisma/client';

/** Follow-up questions the grievance assistant should ask before drafting. Pure + testable. */
export function missingDetails(text: string, category?: ComplaintCategory): string[] {
  const t = text.toLowerCase();
  const q: string[] = [];
  const hasDate =
    /\b(today|yesterday|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?|\d{1,2}(st|nd|rd|th)? (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/.test(
      t,
    );
  if (text.trim().length < 25) q.push('Could you describe the problem in a bit more detail?');
  if ((category === 'ATTENDANCE' || /attend|absent|present/.test(t)) && !hasDate)
    q.push('Which date (and lecture/subject) is this about?');
  if (
    (category === 'ATTENDANCE' || /absent|present/.test(t)) &&
    !/(math|physics|chemistry|dbms|os|network|[a-z]{2,}\d{2,}|subject|lecture|class|lab)/.test(t)
  )
    q.push('Which subject or lecture was it?');
  if (
    (category === 'FEES' || /fee|payment|paid|refund/.test(t)) &&
    !/(₹|rs\.?|inr|\d{3,}|txn|transaction|receipt|ref)/.test(t)
  )
    q.push('What amount did you pay, and do you have a transaction/receipt number?');
  if (
    (category === 'SCHOLARSHIP' || /scholarship/.test(t)) &&
    !/(name|scheme|nsp|post.?matric|merit|[a-z]{4,} scholarship)/.test(t)
  )
    q.push('Which scholarship is this about, and when did you apply?');
  if (
    (category === 'EXAMINATION' || /exam|result|marks/.test(t)) &&
    !/(subject|paper|semester|sem|[a-z]{2,}\d{2,})/.test(t)
  )
    q.push('Which exam/subject and semester is this about?');
  if (
    (category === 'HOSTEL' || category === 'INFRASTRUCTURE') &&
    !/(block|room|floor|building|lab|hall|hostel [a-z0-9])/.test(t)
  )
    q.push('Where exactly (block / room / building)?');
  return q.slice(0, 3);
}
