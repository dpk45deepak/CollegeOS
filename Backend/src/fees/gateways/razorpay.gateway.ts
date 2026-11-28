import { createHmac, timingSafeEqual } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import {
  CreateOrderInput,
  CreateOrderResult,
  PaymentGateway,
  RefundInput,
  RefundResult,
  VerifiedPayment,
} from './payment-gateway';

/** Razorpay Orders + HMAC-SHA256 Webhook Adapter (activated when RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET are set). */
export class RazorpayGateway implements PaymentGateway {
  readonly name = 'razorpay';
  constructor(
    private readonly keyId: string,
    private readonly keySecret: string,
    private readonly webhookSecret?: string,
  ) {}

  private authHeader(): string {
    return `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`;
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: this.authHeader(),
      },
      body: JSON.stringify({
        amount: Math.round(input.amount * 100),
        currency: input.currency || 'INR',
        receipt: input.reference,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      throw new Error(`Razorpay order creation failed with status ${res.status}`);
    }
    const data = (await res.json()) as { id: string; amount: number; currency: string };
    return {
      gatewayRef: data.id,
      clientPayload: { keyId: this.keyId, orderId: data.id, amount: data.amount, currency: data.currency },
    };
  }

  async verifyWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): Promise<VerifiedPayment> {
    const sig = String(headers['x-razorpay-signature'] ?? '');
    const secret = this.webhookSecret || this.keySecret;
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    if (!sig || sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      throw new UnauthorizedException('Invalid Razorpay webhook signature');
    }
    const event = JSON.parse(rawBody.toString('utf8')) as {
      event?: string;
      payload?: { payment?: { entity?: { order_id?: string; status?: string; amount?: number } } };
    };
    const entity = event.payload?.payment?.entity;
    const gatewayRef = entity?.order_id || '';
    const success = event.event === 'payment.captured' || entity?.status === 'captured';
    return {
      gatewayRef,
      success,
      amount: entity?.amount != null ? entity.amount / 100 : undefined,
    };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(input.gatewayRef)}/refund`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: this.authHeader(),
      },
      body: JSON.stringify({
        amount: Math.round(input.amount * 100),
        notes: input.reason ? { reason: input.reason } : undefined,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return { refundGatewayRef: '', success: false, status: 'FAILED' };
    }
    const data = (await res.json()) as { id: string; status?: string };
    return {
      refundGatewayRef: data.id,
      success: true,
      status: data.status || 'PROCESSED',
    };
  }
}
