import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { QUEUES } from '../../queue/queue.constants';
import { EmailMessage, EmailService } from './email.service';

@Injectable()
export class MailQueueService {
  constructor(@InjectQueue(QUEUES.EMAIL) private readonly queue: Queue<EmailMessage>) {}
  enqueue(msg: EmailMessage) {
    return this.queue.add('send', msg);
  }
}

@Processor(QUEUES.EMAIL)
export class EmailProcessor extends WorkerHost {
  constructor(private readonly email: EmailService) {
    super();
  }
  async process(job: Job<EmailMessage>): Promise<void> {
    await this.email.send(job.data);
  }
}
