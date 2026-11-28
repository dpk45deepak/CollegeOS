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

/** Stripe Checkout Session + Signed Webhook Adapter (activated when STRIPE_SECRET_KEY is configured). */
export class StripeGateway implements PaymentGateway {
  readonly name = 'stripe';
  constructor(
    private readonly secretKey: string,
    private readonly webhookSecret?: string,
    private readonly appUrl = 'http://localhost:3000',
  ) {}

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const body = new URLSearchParams({
      mode: 'payment',
      success_url: `${this.appUrl}/student/fees?payment=success`,
      cancel_url: `${this.appUrl}/student/fees?payment=cancelled`,
      client_reference_id: input.reference,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': (input.currency || 'inr').toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(Math.round(input.amount * 100)),
      'line_items[0][price_data][product_data][name]': `College Fee (${input.reference})`,
    });

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.secretKey}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      throw new Error(`Stripe checkout session creation failed with status ${res.status}`);
    }
    const data = (await res.json()) as { id: string; url?: string };
    return { gatewayRef: data.id, checkoutUrl: data.url };
  }

  async verifyWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): Promise<VerifiedPayment> {
    if (!this.webhookSecret) {
      throw new UnauthorizedException('Stripe webhook secret is not configured');
    }
    const sigHeader = String(headers['stripe-signature'] ?? '');
    const parts = Object.fromEntries(sigHeader.split(',').map((p) => p.split('=')));
    const timestamp = parts.t;
    const v1 = parts.v1;
    if (!timestamp || !v1) {
      throw new UnauthorizedException('Missing Stripe webhook signature');
    }
    const expected = createHmac('sha256', this.webhookSecret)
      .update(`${timestamp}.${rawBody.toString('utf8')}`)
      .digest('hex');
    if (v1.length !== expected.length || !timingSafeEqual(Buffer.from(v1), Buffer.from(expected))) {
      throw new UnauthorizedException('Invalid Stripe webhook signature');
    }
    const event = JSON.parse(rawBody.toString('utf8')) as {
      type?: string;
      data?: { object?: { id?: string; payment_status?: string; amount_total?: number } };
    };
    const obj = event.data?.object;
    return {
      gatewayRef: obj?.id || '',
      success: event.type === 'checkout.session.completed' || obj?.payment_status === 'paid',
      amount: obj?.amount_total != null ? obj.amount_total / 100 : undefined,
    };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    const body = new URLSearchParams({
      payment_intent: input.gatewayRef,
      amount: String(Math.round(input.amount * 100)),
    });
    const res = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.secretKey}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return { refundGatewayRef: '', success: false, status: 'FAILED' };
    }
    const data = (await res.json()) as { id: string; status?: string };
    return {
      refundGatewayRef: data.id,
      success: true,
      status: (data.status || 'PROCESSED').toUpperCase(),
    };
  }
}
