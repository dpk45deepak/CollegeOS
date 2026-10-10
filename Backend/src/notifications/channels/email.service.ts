import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { AppConfigService } from '../../config/app-config.service';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter?: Transporter;

  constructor(private readonly config: AppConfigService) {
    const url = config.get('SMTP_URL');
    if (url) this.transporter = createTransport(url);
  }

  async send(msg: EmailMessage): Promise<void> {
    if (!this.transporter) {
      // Dev fallback: never log message bodies in production (they can contain reset links).
      this.logger.warn(
        this.config.isProduction
          ? `SMTP_URL not configured; email to ${msg.to} dropped`
          : `[dev-mail] to=${msg.to} subject="${msg.subject}"\n${msg.text}`,
      );
      return;
    }
    await this.transporter.sendMail({ from: this.config.get('MAIL_FROM'), ...msg });
  }
}
