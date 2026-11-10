import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { QUEUES } from '../../queue/queue.constants';
import { EmailMessage, EmailService } from './email.service';

@Injectable()
export class MailQueueService {
  private readonly logger = new Logger(MailQueueService.name);

  constructor(
    @InjectQueue(QUEUES.EMAIL) private readonly queue: Queue<EmailMessage>,
    private readonly email: EmailService,
  ) {}

  async enqueue(msg: EmailMessage) {
    if (process.env.VERCEL) {
      try {
        await this.email.send(msg);
        return { id: `direct_${Date.now()}` };
      } catch (err) {
        this.logger.warn(`Direct email dispatch failed: ${(err as Error).message}`);
        return null;
      }
    }

    try {
      return await this.queue.add('send', msg);
    } catch (err) {
      this.logger.warn(`Email queue unavailable; sending directly: ${(err as Error).message}`);
      try {
        await this.email.send(msg);
      } catch {
        // non-fatal email error
      }
      return null;
    }
  }
}

@Processor(QUEUES.EMAIL, { autorun: !process.env.VERCEL })
export class EmailProcessor extends WorkerHost {
  constructor(private readonly email: EmailService) {
    super();
  }
  async process(job: Job<EmailMessage>): Promise<void> {
    await this.email.send(job.data);
  }
}
