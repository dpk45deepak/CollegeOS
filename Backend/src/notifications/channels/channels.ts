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

/** Push abstraction. Supports OneSignal (when PUSH_APP_ID is set) or FCM HTTP endpoint (PUSH_API_URL); logs in dev when PUSH_PROVIDER_KEY is unset. */
@Injectable()
export class PushChannel implements ChannelProvider {
  readonly channel = 'PUSH' as const;
  private readonly logger = new Logger(PushChannel.name);
  constructor(private readonly config: AppConfigService) {}
  async send(to: Recipient, n: OutboundNotification) {
    if (!to.pushTokens.length) return;
    const providerKey = this.config.get('PUSH_PROVIDER_KEY');
    if (!providerKey) {
      this.logger.debug(`push (no provider) → ${to.pushTokens.length} device(s): ${n.title}`);
      return;
    }

    const appId = process.env.PUSH_APP_ID;
    if (appId) {
      const res = await fetch(process.env.PUSH_API_URL || 'https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Key ${providerKey}`,
        },
        body: JSON.stringify({
          app_id: appId,
          include_subscription_ids: to.pushTokens,
          headings: { en: n.title },
          contents: { en: n.body },
          data: n.data ?? {},
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`OneSignal push responded ${res.status}`);
      this.logger.debug(`onesignal push sent to user ${to.id}`);
      return;
    }

    const fcmUrl = process.env.PUSH_API_URL || 'https://fcm.googleapis.com/fcm/send';
    const res = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `key=${providerKey}`,
      },
      body: JSON.stringify({
        registration_ids: to.pushTokens,
        notification: { title: n.title, body: n.body },
        data: n.data ?? {},
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Push gateway responded ${res.status}`);
    this.logger.debug(`push sent to user ${to.id} (${to.pushTokens.length} device(s))`);
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
