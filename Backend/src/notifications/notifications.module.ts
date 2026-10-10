import { Global, Module } from '@nestjs/common';
import { EmailChannel, PushChannel, WhatsAppChannel } from './channels/channels';
import { EmailService } from './channels/email.service';
import { EmailProcessor, MailQueueService } from './channels/mail-queue.service';
import { NotificationProcessor, NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [
    EmailService,
    MailQueueService,
    EmailProcessor,
    EmailChannel,
    PushChannel,
    WhatsAppChannel,
    NotificationsService,
    NotificationProcessor,
  ],
  exports: [EmailService, MailQueueService, NotificationsService],
})
export class NotificationsModule {}
