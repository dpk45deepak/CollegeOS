import { Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { FeesController, PaymentWebhookController } from './fees.controller';
import { FeesService } from './fees.service';
import { MockGateway } from './gateways/mock.gateway';
import { RazorpayGateway } from './gateways/razorpay.gateway';
import { StripeGateway } from './gateways/stripe.gateway';
import { PAYMENT_GATEWAYS, PaymentGateway } from './gateways/payment-gateway';

@Module({
  controllers: [FeesController, PaymentWebhookController],
  providers: [
    FeesService,
    {
      provide: PAYMENT_GATEWAYS,
      inject: [AppConfigService],
      // Register configured gateways (Razorpay/Stripe); keep MockGateway strictly for dev/test fallback.
      useFactory: (c: AppConfigService) => {
        const m = new Map<string, PaymentGateway>();
        if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
          m.set(
            'razorpay',
            new RazorpayGateway(
              process.env.RAZORPAY_KEY_ID,
              process.env.RAZORPAY_KEY_SECRET,
              process.env.RAZORPAY_WEBHOOK_SECRET,
            ),
          );
        }
        if (process.env.STRIPE_SECRET_KEY) {
          m.set(
            'stripe',
            new StripeGateway(process.env.STRIPE_SECRET_KEY, process.env.STRIPE_WEBHOOK_SECRET, c.get('APP_URL')),
          );
        }
        if (!c.isProduction || process.env.ENABLE_MOCK_GATEWAY === 'true') {
          m.set('mock', new MockGateway(c.get('JWT_REFRESH_SECRET').slice(0, 32)));
        }
        return m;
      },
    },
  ],
  exports: [FeesService],
})
export class FeesModule {}
