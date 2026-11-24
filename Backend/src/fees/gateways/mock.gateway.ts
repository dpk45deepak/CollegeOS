import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import { CreateOrderInput, CreateOrderResult, PaymentGateway, RefundInput, RefundResult, VerifiedPayment } from './payment-gateway';

/** Dev/test gateway with HMAC-signed webhooks — shows the verification contract real gateways must follow. */
export class MockGateway implements PaymentGateway {
  readonly name = 'mock';
  constructor(private readonly secret: string) {}

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    return { gatewayRef: `mock_${randomUUID()}`, checkoutUrl: `https://mock-gateway.local/pay?ref=${input.reference}` };
  }
  sign(body: string): string {
    return createHmac('sha256', this.secret).update(body).digest('hex');
  }
  async verifyWebhook(raw: Buffer, headers: Record<string, string | string[] | undefined>): Promise<VerifiedPayment> {
    const sig = String(headers['x-mock-signature'] ?? '');
    const expected = this.sign(raw.toString('utf8'));
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
      throw new UnauthorizedException('Bad webhook signature');
    const body = JSON.parse(raw.toString('utf8')) as { gatewayRef: string; status: string; amount?: number };
    return { gatewayRef: body.gatewayRef, success: body.status === 'paid', amount: body.amount };
  }
  async refund(input: RefundInput): Promise<RefundResult> {
    return {
      refundGatewayRef: `mock_ref_${randomUUID()}`,
      success: true,
      status: 'PROCESSED',
    };
  }
}
