import { createHmac } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import { RazorpayGateway } from './razorpay.gateway';
import { StripeGateway } from './stripe.gateway';

describe('PaymentGateway production adapters', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('RazorpayGateway', () => {
    const gateway = new RazorpayGateway('rzp_test_id', 'rzp_test_secret', 'whsec_test');

    it('creates a Razorpay order in paise and returns client payload', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'order_rzp_1', amount: 150050, currency: 'INR' }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      const res = await gateway.createOrder({
        amount: 1500.5,
        currency: 'INR',
        reference: 'FEE-INV-01',
        studentName: 'Aarav Sharma',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.razorpay.com/v1/orders',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            authorization: `Basic ${Buffer.from('rzp_test_id:rzp_test_secret').toString('base64')}`,
          }),
        }),
      );
      expect(res).toEqual({
        gatewayRef: 'order_rzp_1',
        clientPayload: {
          keyId: 'rzp_test_id',
          orderId: 'order_rzp_1',
          amount: 150050,
          currency: 'INR',
        },
      });
    });

    it('verifies a valid Razorpay HMAC-SHA256 webhook signature', async () => {
      const payload = JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { entity: { order_id: 'order_rzp_1', status: 'captured', amount: 150050 } } },
      });
      const rawBody = Buffer.from(payload, 'utf8');
      const sig = createHmac('sha256', 'whsec_test').update(rawBody).digest('hex');

      const verified = await gateway.verifyWebhook(rawBody, { 'x-razorpay-signature': sig });
      expect(verified).toEqual({
        gatewayRef: 'order_rzp_1',
        success: true,
        amount: 1500.5,
      });
    });

    it('rejects a tampered Razorpay webhook signature', async () => {
      const rawBody = Buffer.from('{"event":"payment.captured"}', 'utf8');
      await expect(
        gateway.verifyWebhook(rawBody, { 'x-razorpay-signature': '0'.repeat(64) }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns FAILED status when Razorpay refund API responds with error', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400 }) as unknown as typeof fetch;
      const refund = await gateway.refund({ gatewayRef: 'pay_1', amount: 500, currency: 'INR', reason: 'duplicate' });
      expect(refund).toEqual({ refundGatewayRef: '', success: false, status: 'FAILED' });
    });
  });

  describe('StripeGateway', () => {
    const gateway = new StripeGateway('sk_test_123', 'whsec_stripe_123', 'https://collegeos.edu');

    it('creates a Stripe Checkout Session and returns checkoutUrl', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'cs_test_1', url: 'https://checkout.stripe.com/pay/cs_test_1' }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      const res = await gateway.createOrder({
        amount: 2500,
        currency: 'INR',
        reference: 'FEE-INV-02',
        studentName: 'Diya Verma',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.stripe.com/v1/checkout/sessions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            authorization: 'Bearer sk_test_123',
            'content-type': 'application/x-www-form-urlencoded',
          }),
        }),
      );
      expect(res).toEqual({
        gatewayRef: 'cs_test_1',
        checkoutUrl: 'https://checkout.stripe.com/pay/cs_test_1',
      });
    });

    it('verifies Stripe signed t=...,v1=... webhooks', async () => {
      const bodyStr = JSON.stringify({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test_1', payment_status: 'paid', amount_total: 250000 } },
      });
      const rawBody = Buffer.from(bodyStr, 'utf8');
      const timestamp = '1700000000';
      const v1 = createHmac('sha256', 'whsec_stripe_123')
        .update(`${timestamp}.${bodyStr}`)
        .digest('hex');

      const verified = await gateway.verifyWebhook(rawBody, {
        'stripe-signature': `t=${timestamp},v1=${v1}`,
      });
      expect(verified).toEqual({
        gatewayRef: 'cs_test_1',
        success: true,
        amount: 2500,
      });
    });

    it('rejects missing Stripe webhook secret or tampered signature', async () => {
      const noSecret = new StripeGateway('sk_test_123');
      await expect(
        noSecret.verifyWebhook(Buffer.from('{}'), { 'stripe-signature': 't=1,v1=abc' }),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        gateway.verifyWebhook(Buffer.from('{}'), { 'stripe-signature': `t=1700000000,v1=${'a'.repeat(64)}` }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
