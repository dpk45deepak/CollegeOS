import { FeeStatus } from '@prisma/client';

/** Money is handled in integer paise to avoid float drift. */
export const toPaise = (rupees: number | string | { toString(): string }) =>
  Math.round(Number(rupees.toString()) * 100);
export const fromPaise = (p: number) => p / 100;

export interface FeeSnapshot {
  amountDue: number;
  discount: number;
  scholarshipAdjustment: number;
  amountPaid: number;
  dueDate: Date;
}

export function netPayable(f: Pick<FeeSnapshot, 'amountDue' | 'discount' | 'scholarshipAdjustment'>): number {
  return Math.max(0, fromPaise(toPaise(f.amountDue) - toPaise(f.discount) - toPaise(f.scholarshipAdjustment)));
}
export function outstanding(f: FeeSnapshot): number {
  return Math.max(0, fromPaise(toPaise(netPayable(f)) - toPaise(f.amountPaid)));
}
export function feeStatus(f: FeeSnapshot, today = new Date()): FeeStatus {
  const net = netPayable(f);
  if (net === 0) return 'WAIVED';
  const out = outstanding(f);
  if (out === 0) return 'PAID';
  if (f.dueDate < new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))) return 'OVERDUE';
  return f.amountPaid > 0 ? 'PARTIAL' : 'PENDING';
}
export function sumComponents(components: { amount: number }[]): number {
  return fromPaise(components.reduce((s, c) => s + toPaise(c.amount), 0));
}
