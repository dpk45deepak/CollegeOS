import { Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { FeesController, PaymentWebhookController } from './fees.controller';
import { FeesService } from './fees.service';
import { MockGateway } from './gateways/mock.gateway';
import { PAYMENT_GATEWAYS, PaymentGateway } from './gateways/payment-gateway';

@Module({
  controllers: [FeesController, PaymentWebhookController],
  providers: [
    FeesService,
    {
      provide: PAYMENT_GATEWAYS,
      inject: [AppConfigService],
      // Register real gateways (Razorpay/Stripe) here. The mock gateway is dev/test fallback.
      useFactory: (c: AppConfigService) => {
        const m = new Map<string, PaymentGateway>();
        if (!c.isProduction || process.env.ENABLE_MOCK_GATEWAY === 'true' || m.size === 0) {
          m.set('mock', new MockGateway(c.get('JWT_REFRESH_SECRET').slice(0, 32)));
        }
        return m;
      },
    },
  ],
  exports: [FeesService],
})
export class FeesModule {}
