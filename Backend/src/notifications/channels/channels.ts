import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { EmailService } from './email.service';

export interface Recipient {
  id: string;
  email: string;
  phone: string | null;
  pushTokens: string[];
  isParent: boolean;
}
export interface OutboundNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: unknown;
}

export interface ChannelProvider {
  readonly channel: 'EMAIL' | 'PUSH' | 'WHATSAPP';
  send(to: Recipient, n: OutboundNotification): Promise<void>;
}

@Injectable()
export class EmailChannel implements ChannelProvider {
  readonly channel = 'EMAIL' as const;
  constructor(private readonly email: EmailService) {}
  send(to: Recipient, n: OutboundNotification) {
    return this.email.send({ to: to.email, subject: n.title, text: n.body });
  }
}

/** Push abstraction. Plug FCM/APNs/OneSignal here; the default logs so dev flows work without credentials. */
@Injectable()
export class PushChannel implements ChannelProvider {
  readonly channel = 'PUSH' as const;
  private readonly logger = new Logger(PushChannel.name);
  constructor(private readonly config: AppConfigService) {}
  async send(to: Recipient, n: OutboundNotification) {
    if (!to.pushTokens.length) return;
    if (!this.config.get('PUSH_PROVIDER_KEY')) {
      this.logger.debug(`push (no provider) → ${to.pushTokens.length} device(s): ${n.title}`);
      return;
    }
    // TODO(provider): call FCM HTTP v1 / OneSignal with `to.pushTokens` and `n`.
    this.logger.warn('PUSH_PROVIDER_KEY set but no push provider implementation registered');
  }
}

/** WhatsApp abstraction over a generic REST gateway (adapt the payload for Meta Cloud API / Twilio). */
@Injectable()
export class WhatsAppChannel implements ChannelProvider {
  readonly channel = 'WHATSAPP' as const;
  private readonly logger = new Logger(WhatsAppChannel.name);
  constructor(private readonly config: AppConfigService) {}
  async send(to: Recipient, n: OutboundNotification) {
    const url = this.config.get('WHATSAPP_API_URL');
    if (!url || !to.phone) return;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.config.get('WHATSAPP_API_TOKEN') ?? ''}`,
      },
      body: JSON.stringify({ to: to.phone, text: `${n.title}\n${n.body}` }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`WhatsApp gateway responded ${res.status}`); // BullMQ retries with backoff
    this.logger.debug(`whatsapp sent to user ${to.id}`);
  }
}
