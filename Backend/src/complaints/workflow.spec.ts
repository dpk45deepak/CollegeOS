import { bumpPriority, canTransition, classifyComplaint, slaDueAt } from './workflow';

describe('complaint workflow', () => {
  it('routes the scholarship example to Accounts', () => {
    const r = classifyComplaint("My scholarship hasn't been credited");
    expect(r).toMatchObject({ category: 'SCHOLARSHIP', handlerRole: 'ACCOUNTANT', priority: 'MEDIUM' });
  });
  it('routes attendance disputes to the HOD of the student department', () => {
    const r = classifyComplaint("My teacher marked me absent even though I attended today's lecture");
    expect(r.category).toBe('ATTENDANCE');
    expect(r.departmental).toBe(true);
  });
  it('treats ragging / harassment as critical and never departmental', () => {
    const r = classifyComplaint('I am being harassed in the hostel');
    expect(r).toMatchObject({ priority: 'CRITICAL', handlerRole: 'COLLEGE_ADMIN', departmental: false });
  });
  it('falls back to admin with low confidence', () => {
    expect(classifyComplaint('hello there').confidence).toBeLessThan(0.5);
  });
  it('enforces the state machine', () => {
    expect(canTransition('OPEN', 'ASSIGNED')).toBe(true);
    expect(canTransition('OPEN', 'AWAITING_FEEDBACK')).toBe(false);
    expect(canTransition('CLOSED', 'REOPENED')).toBe(false);
    expect(canTransition('AWAITING_FEEDBACK', 'REOPENED')).toBe(true);
  });
  it('computes SLA and escalation priority', () => {
    const t = new Date('2026-01-01T00:00:00Z');
    expect(slaDueAt('HIGH', t).toISOString()).toBe('2026-01-02T00:00:00.000Z');
    expect(bumpPriority('MEDIUM')).toBe('HIGH');
    expect(bumpPriority('CRITICAL')).toBe('CRITICAL');
  });
});
