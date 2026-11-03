import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FeeStatus, PaymentStatus, Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { OwnershipService } from '../access/ownership.service';
import { AuditService } from '../audit/audit.service';
import { paginate, toSkipTake } from '../common/dto/pagination.dto';
import { DomainEvents, NOTIFY } from '../common/events';
import { Principal } from '../common/types/principal';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import * as D from './dto/fees.dto';
import { feeStatus, fromPaise, netPayable, outstanding, sumComponents, toPaise } from './fee-math';
import { PAYMENT_GATEWAYS, PaymentGateway } from './gateways/payment-gateway';

type FeeRow = {
  amountDue: Prisma.Decimal;
  discount: Prisma.Decimal;
  scholarshipAdjustment: Prisma.Decimal;
  amountPaid: Prisma.Decimal;
  dueDate: Date;
};
const snap = (f: FeeRow) => ({
  amountDue: Number(f.amountDue),
  discount: Number(f.discount),
  scholarshipAdjustment: Number(f.scholarshipAdjustment),
  amountPaid: Number(f.amountPaid),
  dueDate: f.dueDate,
});
const decorate = <T extends FeeRow>(f: T) => ({
  ...f,
  netPayable: netPayable(snap(f)),
  outstanding: outstanding(snap(f)),
  computedStatus: feeStatus(snap(f)),
});

@Injectable()
export class FeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly own: OwnershipService,
    private readonly audit: AuditService,
    private readonly events: EventEmitter2,
    private readonly redis: RedisService,
    @Inject(PAYMENT_GATEWAYS) private readonly gateways: Map<string, PaymentGateway>,
  ) {}

  createStructure(c: string, dto: D.CreateFeeStructureDto) {
    return this.prisma.feeStructure.create({
      data: {
        collegeId: c,
        name: dto.name,
        academicYear: dto.academicYear,
        programId: dto.programId,
        batchId: dto.batchId,
        components: dto.components as unknown as Prisma.InputJsonValue,
        totalAmount: sumComponents(dto.components),
      },
    });
  }
  listStructures(c: string) {
    return this.prisma.feeStructure.findMany({ where: { collegeId: c }, orderBy: { academicYear: 'desc' } });
  }

  async assign(c: string, structureId: string, dto: D.AssignFeeDto, actorId: string) {
    await this.own.assert('feeStructure', structureId, c);
    const structure = await this.prisma.feeStructure.findUniqueOrThrow({ where: { id: structureId } });
    let studentIds = dto.studentIds ?? [];
    if (dto.batchId)
      studentIds = (
        await this.prisma.student.findMany({ where: { collegeId: c, batchId: dto.batchId }, select: { id: true } })
      ).map((s) => s.id);
    if (!studentIds.length) throw new BadRequestException('No students selected');
    await this.own.assert('student', studentIds, c);
    const res = await this.prisma.studentFee.createMany({
      data: studentIds.map((studentId) => ({
        collegeId: c,
        studentId,
        feeStructureId: structureId,
        amountDue: structure.totalAmount,
        dueDate: dto.dueDate,
      })),
    });
    await this.audit.log({
      collegeId: c,
      userId: actorId,
      action: 'FEE_ASSIGN',
      entity: 'FeeStructure',
      entityId: structureId,
      newValue: { students: res.count },
    });
    return { assigned: res.count };
  }

  async adjust(c: string, id: string, dto: D.AdjustFeeDto, actorId: string) {
    await this.own.assert('studentFee', id, c);
    const before = await this.prisma.studentFee.findUniqueOrThrow({ where: { id } });
    const merged = {
      ...snap(before),
      discount: dto.discount ?? Number(before.discount),
      scholarshipAdjustment: dto.scholarshipAdjustment ?? Number(before.scholarshipAdjustment),
    };
    const updated = await this.prisma.studentFee.update({
      where: { id },
      data: {
        discount: merged.discount,
        scholarshipAdjustment: merged.scholarshipAdjustment,
        status: feeStatus(merged),
      },
    });
    await this.audit.log({
      collegeId: c,
      userId: actorId,
      action: 'FEE_ADJUST',
      entity: 'StudentFee',
      entityId: id,
      oldValue: { discount: before.discount, scholarshipAdjustment: before.scholarshipAdjustment },
      newValue: { discount: dto.discount, scholarshipAdjustment: dto.scholarshipAdjustment },
      reason: dto.reason,
    });
    return decorate(updated);
  }

  async forStudent(c: string, studentId: string) {
    const rows = await this.prisma.studentFee.findMany({
      where: { collegeId: c, studentId },
      include: {
        feeStructure: { select: { name: true, academicYear: true, components: true } },
        payments: { select: { id: true, amount: true, status: true, paidAt: true, receiptNo: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
    return rows.map(decorate);
  }

  async list(c: string, q: D.FeeListQueryDto) {
    const where: Prisma.StudentFeeWhereInput = { collegeId: c, status: q.status, studentId: q.studentId };
    const [items, total] = await Promise.all([
      this.prisma.studentFee.findMany({
        where,
        orderBy: { dueDate: 'asc' },
        ...toSkipTake(q),
        include: { student: { select: { rollNumber: true, user: { select: { firstName: true, lastName: true } } } } },
      }),
      this.prisma.studentFee.count({ where }),
    ]);
    return paginate(items.map(decorate), total, q);
  }

  // ── payments ───────────────────────────────────────
  async startPayment(p: Principal, c: string, feeId: string, dto: D.StartPaymentDto) {
    const gw = this.gateways.get(dto.gateway);
    if (!gw) throw new BadRequestException('Unknown payment gateway');
    const fee = await this.ownFee(p, c, feeId);
    const out = outstanding(snap(fee));
    const amount = dto.amount ?? out;
    if (out <= 0) throw new ConflictException('Nothing is outstanding');
    if (amount > out) throw new BadRequestException(`Amount exceeds outstanding ${out}`);
    const payment = await this.prisma.payment.create({
      data: { collegeId: c, studentFeeId: feeId, amount, gateway: gw.name },
    });
    const order = await gw.createOrder({ amount, currency: 'INR', reference: payment.id });
    await this.prisma.payment.update({ where: { id: payment.id }, data: { gatewayRef: order.gatewayRef } });
    return { paymentId: payment.id, ...order };
  }

  /** Idempotent: a repeated webhook for the same gatewayRef is a no-op. */
  async handleWebhook(gatewayName: string, raw: Buffer, headers: Record<string, string | string[] | undefined>) {
    const gw = this.gateways.get(gatewayName);
    if (!gw) throw new NotFoundException();
    const v = await gw.verifyWebhook(raw, headers);
    const payment = await this.prisma.payment.findFirst({ where: { gateway: gw.name, gatewayRef: v.gatewayRef } });
    if (!payment) throw new NotFoundException('Unknown payment');
    if (payment.status !== PaymentStatus.PENDING) return { ok: true, duplicate: true };
    if (!v.success) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED } });
      return { ok: true };
    }
    await this.settle(payment.id, payment.collegeId);
    return { ok: true };
  }

  async recordManual(c: string, feeId: string, dto: D.ManualPaymentDto, actorId: string) {
    await this.own.assert('studentFee', feeId, c);
    const fee = await this.prisma.studentFee.findUniqueOrThrow({ where: { id: feeId } });
    const out = outstanding(snap(fee));
    if (dto.amount > out) throw new BadRequestException(`Amount exceeds outstanding ${out}`);
    const payment = await this.prisma.payment.create({
      data: {
        collegeId: c,
        studentFeeId: feeId,
        amount: dto.amount,
        gateway: `manual:${dto.mode}`.slice(0, 40),
        gatewayRef: dto.reference,
      },
    });
    await this.settle(payment.id, c);
    await this.audit.log({
      collegeId: c,
      userId: actorId,
      action: 'PAYMENT_MANUAL',
      entity: 'Payment',
      entityId: payment.id,
      newValue: { amount: dto.amount, mode: dto.mode },
    });
    return this.receipt(c, payment.id);
  }

  private async settle(paymentId: string, c: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.payment.updateMany({
        where: { id: paymentId, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.SUCCESS, paidAt: new Date(), receiptNo: await this.receiptNo(c) },
      });
      if (claimed.count !== 1) return;
      const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
      const fee = await tx.studentFee.findUniqueOrThrow({
        where: { id: payment.studentFeeId },
        include: { student: { select: { userId: true } } },
      });
      const paid = fromPaise(toPaise(fee.amountPaid) + toPaise(payment.amount));
      const status = feeStatus({ ...snap(fee), amountPaid: paid });
      await tx.studentFee.update({ where: { id: fee.id }, data: { amountPaid: paid, status } });
      this.events.emit(NOTIFY, {
        collegeId: c,
        userIds: [fee.student.userId],
        type: 'PaymentReceived',
        title: 'Payment received',
        body: `₹${payment.amount} received. Status: ${status}.`,
        data: { paymentId },
      });
    });
  }

  async receipt(c: string, paymentId: string) {
    const p = await this.prisma.payment.findFirst({
      where: { id: paymentId, collegeId: c, status: { in: ['SUCCESS', 'PARTIALLY_REFUNDED', 'REFUNDED'] } },
      include: {
        refunds: true,
        studentFee: {
          include: {
            feeStructure: { select: { name: true, academicYear: true } },
            student: {
              select: {
                rollNumber: true,
                collegeStudentId: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });
    if (!p) throw new NotFoundException('Receipt not found');
    return {
      receiptNo: p.receiptNo,
      paidAt: p.paidAt,
      amount: p.amount,
      currency: p.currency,
      gateway: p.gateway,
      status: p.status,
      fee: p.studentFee.feeStructure,
      student: p.studentFee.student,
      refunds: p.refunds,
    };
  }
  async receiptForStudent(p: Principal, c: string, paymentId: string) {
    const pay = await this.prisma.payment.findFirst({
      where: { id: paymentId, collegeId: c, studentFee: { studentId: p.studentId ?? '__none__' } },
      select: { id: true },
    });
    if (!pay) throw new NotFoundException('Receipt not found');
    return this.receipt(c, paymentId);
  }

  async refund(c: string, paymentId: string, dto: D.RefundDto, actorId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, collegeId: c },
      include: { refunds: true },
    });
    if (!payment || (payment.status !== 'SUCCESS' && payment.status !== 'PARTIALLY_REFUNDED'))
      throw new NotFoundException('Refundable payment not found');
    const refunded = payment.refunds.reduce((s, r) => s + toPaise(r.amount), 0);
    if (toPaise(dto.amount) + refunded > toPaise(payment.amount))
      throw new BadRequestException('Refund exceeds the paid amount');
    await this.prisma.$transaction(async (tx) => {
      await tx.refund.create({
        data: { paymentId, amount: dto.amount, reason: dto.reason, status: 'PROCESSED', processedAt: new Date() },
      });
      const full = toPaise(dto.amount) + refunded === toPaise(payment.amount);
      await tx.payment.update({ where: { id: paymentId }, data: { status: full ? 'REFUNDED' : 'PARTIALLY_REFUNDED' } });
      const fee = await tx.studentFee.findUniqueOrThrow({ where: { id: payment.studentFeeId } });
      const paid = Math.max(0, fromPaise(toPaise(fee.amountPaid) - toPaise(dto.amount)));
      await tx.studentFee.update({
        where: { id: fee.id },
        data: { amountPaid: paid, status: feeStatus({ ...snap(fee), amountPaid: paid }) },
      });
      await this.audit.log(
        {
          collegeId: c,
          userId: actorId,
          action: 'REFUND',
          entity: 'Payment',
          entityId: paymentId,
          newValue: { amount: dto.amount },
          reason: dto.reason,
        },
        tx,
      );
    });
    return { refunded: dto.amount };
  }

  /** Scheduler hook: reminds students of fees due within 3 days or overdue (once per 3 days per fee). */
  async notifyDue(c: string): Promise<number> {
    const horizon = new Date(Date.now() + 3 * 86_400_000);
    const fees = await this.prisma.studentFee.findMany({
      where: {
        collegeId: c,
        status: { in: [FeeStatus.PENDING, FeeStatus.PARTIAL, FeeStatus.OVERDUE] },
        dueDate: { lte: horizon },
      },
      include: { student: { select: { userId: true, guardians: { select: { userId: true } } } } },
      take: 5000,
    });
    let n = 0;
    for (const f of fees) {
      const out = outstanding(snap(f));
      if (out <= 0 || !(await this.redis.client.set(`feedue:${f.id}`, '1', 'EX', 3 * 86_400, 'NX'))) continue;
      const overdue = f.dueDate < new Date();
      this.events.emit(DomainEvents.FeeDue, { collegeId: c, studentFeeId: f.id });
      this.events.emit(NOTIFY, {
        collegeId: c,
        userIds: [f.student.userId, ...f.student.guardians.map((g) => g.userId).filter((x): x is string => !!x)],
        type: 'FeeDue',
        title: overdue ? 'Fee overdue' : 'Fee due soon',
        body: `₹${out} outstanding, due ${f.dueDate.toISOString().slice(0, 10)}.`,
        data: { studentFeeId: f.id },
      });
      n++;
    }
    return n;
  }

  private async ownFee(p: Principal, c: string, feeId: string) {
    const fee = await this.prisma.studentFee.findFirst({
      where: {
        id: feeId,
        collegeId: c,
        student: p.studentId
          ? { id: p.studentId }
          : p.guardianOfStudentIds.length
            ? { id: { in: p.guardianOfStudentIds } }
            : { id: '__none__' },
      },
    });
    if (!fee) throw new NotFoundException('Fee record not found');
    return fee;
  }
  private async receiptNo(c: string): Promise<string> {
    const d = new Date();
    try {
      const key = `receipt:${c}:${d.getUTCFullYear()}`;
      const n = await this.redis.client.incr(key);
      return `RCPT-${d.getUTCFullYear()}-${String(n).padStart(6, '0')}-${randomBytes(2).toString('hex').toUpperCase()}`;
    } catch {
      const count = await this.prisma.payment.count({ where: { collegeId: c } });
      return `RCPT-${d.getUTCFullYear()}-${String(count + 1).padStart(6, '0')}-${randomBytes(2).toString('hex').toUpperCase()}`;
    }
  }
}
export { PaymentStatus };
