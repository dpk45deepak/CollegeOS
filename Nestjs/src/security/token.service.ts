import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { AppConfigService } from '../config/app-config.service';

export interface AccessPayload {
  sub: string;
  sid: string;
  cid: string | null;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  signAccess(userId: string, sessionId: string, collegeId: string | null): string {
    return this.jwt.sign({ sub: userId, sid: sessionId, cid: collegeId } satisfies AccessPayload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_TTL'),
    });
  }

  verifyAccess(token: string): AccessPayload {
    return this.jwt.verify<AccessPayload>(token, { secret: this.config.get('JWT_SECRET') });
  }

  /** Opaque refresh token: `<sessionId>.<random>`; only an HMAC of it is stored. */
  newRefreshSecret(): string {
    return randomBytes(48).toString('base64url');
  }
  hash(raw: string): string {
    return createHmac('sha256', this.config.get('JWT_REFRESH_SECRET')).update(raw).digest('hex');
  }
  safeEqual(a: string, b: string): boolean {
    const x = Buffer.from(a);
    const y = Buffer.from(b);
    return x.length === y.length && timingSafeEqual(x, y);
  }
  refreshTtlMs(): number {
    const v = this.config.get('JWT_REFRESH_TTL');
    const m = /^(\d+)([smhd])$/.exec(v);
    if (!m) return 7 * 86_400_000;
    return Number(m[1]) * { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[m[2] as 's' | 'm' | 'h' | 'd'];
  }
}
