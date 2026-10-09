import { Body, Controller, Get, Headers, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { P } from '../auth/permissions';
import { CurrentUser, Public, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { SkipEnvelope } from '../common/decorators/skip-envelope.decorator';
import { Principal } from '../common/types/principal';
import * as D from './dto/fees.dto';
import { FeesService } from './fees.service';

@ApiTags('Fees')
@ApiBearerAuth()
@Controller('fees')
export class FeesController {
  constructor(private readonly svc: FeesService) {}

  @Post('structures') @RequirePermissions(P.FEE_MANAGE) createStructure(
    @Tenant() t: string,
    @Body() dto: D.CreateFeeStructureDto,
  ) {
    return this.svc.createStructure(t, dto);
  }
  @Get('structures') @RequirePermissions(P.FEE_VIEW_ALL) structures(@Tenant() t: string) {
    return this.svc.listStructures(t);
  }
  @Post('structures/:id/assign')
  @RequirePermissions(P.FEE_MANAGE)
  @ApiOperation({ summary: 'Assign a fee structure to students / a batch' })
  assign(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string, @Body() dto: D.AssignFeeDto) {
    return this.svc.assign(t, id, dto, u.userId);
  }

  @Get()
  @RequirePermissions(P.FEE_VIEW_ALL)
  @ApiOperation({ summary: 'All student fee records (filter by status → pending/overdue)' })
  list(@Tenant() t: string, @Query() q: D.FeeListQueryDto) {
    return this.svc.list(t, q);
  }

  @Post('student-fees/:id/adjust')
  @RequirePermissions(P.FEE_MANAGE)
  @ApiOperation({ summary: 'Apply discount / scholarship adjustment', description: 'Audited with reason.' })
  adjust(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string, @Body() dto: D.AdjustFeeDto) {
    return this.svc.adjust(t, id, dto, u.userId);
  }

  @Post(':id/payments')
  @RequirePermissions(P.FEE_VIEW_OWN)
  @ApiOperation({
    summary: 'Start an online payment via a gateway (hosted checkout)',
    description: 'No card data is accepted by this API.',
  })
  start(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string, @Body() dto: D.StartPaymentDto) {
    return this.svc.startPayment(u, t, id, dto);
  }
  @Post(':id/payments/manual')
  @RequirePermissions(P.PAYMENT_CREATE)
  @ApiOperation({ summary: 'Record a counter payment (cash / DD / bank transfer)' })
  manual(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string, @Body() dto: D.ManualPaymentDto) {
    return this.svc.recordManual(t, id, dto, u.userId);
  }
  @Get('payments/:paymentId/receipt')
  @RequirePermissions(P.FEE_VIEW_OWN)
  receipt(@CurrentUser() u: Principal, @Tenant() t: string, @Param('paymentId') id: string) {
    return this.svc.receiptForStudent(u, t, id);
  }
  @Get('payments/:paymentId/receipt/admin')
  @RequirePermissions(P.FEE_VIEW_ALL)
  receiptAdmin(@Tenant() t: string, @Param('paymentId') id: string) {
    return this.svc.receipt(t, id);
  }
  @Post('payments/:paymentId/refunds')
  @RequirePermissions(P.REFUND_MANAGE)
  refund(@CurrentUser() u: Principal, @Tenant() t: string, @Param('paymentId') id: string, @Body() dto: D.RefundDto) {
    return this.svc.refund(t, id, dto, u.userId);
  }
}

@ApiTags('Fees')
@Controller('webhooks/payments')
export class PaymentWebhookController {
  constructor(private readonly svc: FeesService) {}

  @Public()
  @SkipThrottle()
  @SkipEnvelope()
  @Post(':gateway')
  @HttpCode(200)
  @ApiOperation({ summary: 'Gateway webhook (signature-verified, idempotent)' })
  hook(
    @Param('gateway') gateway: string,
    @Req() req: Request & { rawBody?: Buffer },
    @Headers() headers: Record<string, string>,
  ) {
    return this.svc.handleWebhook(gateway, req.rawBody ?? Buffer.from(JSON.stringify(req.body)), headers);
  }
}
