import { feeStatus, netPayable, outstanding, sumComponents } from './fee-math';

const base = {
  amountDue: 50000,
  discount: 0,
  scholarshipAdjustment: 0,
  amountPaid: 0,
  dueDate: new Date('2030-01-01'),
};
describe('fee math', () => {
  it('has no float drift', () => {
    expect(sumComponents([{ amount: 0.1 }, { amount: 0.2 }])).toBe(0.3);
  });
  it('applies discount and scholarship', () => {
    expect(netPayable({ ...base, discount: 5000, scholarshipAdjustment: 10000 })).toBe(35000);
  });
  it('derives status', () => {
    expect(feeStatus(base)).toBe('PENDING');
    expect(feeStatus({ ...base, amountPaid: 100 })).toBe('PARTIAL');
    expect(feeStatus({ ...base, amountPaid: 50000 })).toBe('PAID');
    expect(feeStatus({ ...base, dueDate: new Date('2020-01-01') })).toBe('OVERDUE');
    expect(feeStatus({ ...base, scholarshipAdjustment: 50000 })).toBe('WAIVED');
    expect(outstanding({ ...base, amountPaid: 20000 })).toBe(30000);
  });
});
