import { Prisma } from '@prisma/client';
import { FeesService } from './fees.service';

describe('FeesService.list', () => {
  it('includes feeStructure and payments and attaches computed fee fields', async () => {
    const row = {
      id: 'fee1',
      studentId: 'stu1',
      amountDue: new Prisma.Decimal(50000),
      discount: new Prisma.Decimal(0),
      scholarshipAdjustment: new Prisma.Decimal(0),
      amountPaid: new Prisma.Decimal(50000),
      dueDate: new Date('2026-08-01'),
      feeStructure: { id: 'fs1', name: 'Tuition Fee Sem 5', academicYear: '2026-27' },
      payments: [{ id: 'pay1', amount: 50000, status: 'SUCCESS', receiptNo: 'RCP-001' }],
      student: { rollNumber: '23CSE001', user: { firstName: 'Aarav', lastName: 'Sharma' } },
    };
    const findMany = jest.fn(async (_args: Record<string, unknown>) => [row]);
    const prisma = {
      studentFee: { findMany, count: jest.fn(async () => 1) },
    };

    const svc = new FeesService(
      prisma as never,
      {} as never,
      {} as never,
      { emit: jest.fn() } as never,
      {} as never,
      new Map(),
    );

    const res = await svc.list('c1', { page: 1, limit: 20 });
    const includeArg = findMany.mock.calls[0][0].include as Record<string, unknown>;
    expect(includeArg).toHaveProperty('feeStructure');
    expect(includeArg).toHaveProperty('payments');
    expect(res.data[0].feeStructure?.name).toBe('Tuition Fee Sem 5');
    expect(res.data[0].payments).toHaveLength(1);
    expect(res.data[0].outstanding).toBe(0);
    expect(res.data[0].computedStatus).toBe('PAID');
  });
});
