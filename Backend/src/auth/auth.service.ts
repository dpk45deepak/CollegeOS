import { HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { OneTimeTokenType, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { AppConfigService } from '../config/app-config.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MailQueueService } from '../notifications/channels/mail-queue.service';
import { PrincipalService } from '../security/principal.service';
import { TokenService } from '../security/token.service';
import { revokedKey } from '../common/guards/jwt-auth.guard';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;
const BCRYPT_ROUNDS = 12;
// Compared against when the user does not exist so response time doesn't reveal valid IDs.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

export interface ClientMeta {
  ip?: string;
  userAgent?: string;
}
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  sessionId: string;
}

const invalid = () => new UnauthorizedException({ message: 'Invalid credentials', errorCode: 'INVALID_CREDENTIALS' });

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly config: AppConfigService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
    private readonly mail: MailQueueService,
    private readonly principals: PrincipalService,
  ) {}

  hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  async login(dto: { collegeCode?: string; loginId: string; password: string; deviceName?: string }, meta: ClientMeta) {
    const college = dto.collegeCode
      ? await this.prisma.college.findUnique({ where: { code: dto.collegeCode.toUpperCase() } })
      : null;
    if (dto.collegeCode && !college) {
      await bcrypt.compare(dto.password, DUMMY_HASH);
      await this.recordAttempt(null, dto.loginId, null, false, meta);
      throw invalid();
    }
    const user = await this.prisma.user.findFirst({
      where: { collegeId: college?.id ?? null, loginId: dto.loginId },
    });

    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !user.passwordHash || !ok) {
      await this.recordAttempt(college?.id ?? null, dto.loginId, user?.id ?? null, false, meta);
      if (user) await this.registerFailure(user.id, user.failedLoginAttempts + 1);
      throw invalid();
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new HttpException(
        { message: 'Account temporarily locked. Try again later.', errorCode: 'ACCOUNT_LOCKED' },
        423,
      );
    }
    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new UnauthorizedException({ message: 'Email not verified', errorCode: 'EMAIL_NOT_VERIFIED' });
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({ message: 'Account is not active', errorCode: 'ACCOUNT_INACTIVE' });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    await this.recordAttempt(college?.id ?? null, dto.loginId, user.id, true, meta);
    const pair = await this.createSession(user.id, user.collegeId, randomUUID(), dto.deviceName, meta);
    await this.audit.log({
      collegeId: user.collegeId,
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
    });
    return pair;
  }

  async refresh(rawToken: string, meta: ClientMeta): Promise<TokenPair> {
    const [sid, secret] = rawToken.split('.');
    if (!sid || !secret)
      throw new UnauthorizedException({ message: 'Invalid refresh token', errorCode: 'REFRESH_INVALID' });
    const session = await this.prisma.authSession.findUnique({ where: { id: sid } });
    if (!session || !this.tokens.safeEqual(session.refreshTokenHash, this.tokens.hash(rawToken))) {
      throw new UnauthorizedException({ message: 'Invalid refresh token', errorCode: 'REFRESH_INVALID' });
    }
    if (session.revokedAt) {
      // A rotated-out token was presented again: assume theft and kill the whole family.
      await this.revokeFamily(session.familyId);
      await this.audit.log({
        userId: session.userId,
        action: 'REFRESH_TOKEN_REUSE',
        entity: 'AuthSession',
        entityId: session.id,
      });
      throw new UnauthorizedException({ message: 'Refresh token reuse detected', errorCode: 'REFRESH_REUSED' });
    }
    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException({ message: 'Refresh token expired', errorCode: 'REFRESH_EXPIRED' });
    }
    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({ message: 'Account is not active', errorCode: 'ACCOUNT_INACTIVE' });
    }
    await this.revokeSession(session.id);
    return this.createSession(user.id, user.collegeId, session.familyId, session.deviceName ?? undefined, meta);
  }

  async logout(sessionId: string): Promise<void> {
    await this.revokeSession(sessionId);
  }

  async logoutAll(userId: string): Promise<void> {
    const sessions = await this.prisma.authSession.findMany({
      where: { userId, revokedAt: null },
      select: { id: true },
    });
    await this.prisma.authSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await Promise.all(sessions.map((s) => this.markRevoked(s.id)));
  }

  listSessions(userId: string) {
    return this.prisma.authSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, deviceName: true, ip: true, userAgent: true, lastUsedAt: true, createdAt: true },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  async revokeOwnSession(userId: string, sessionId: string): Promise<void> {
    const s = await this.prisma.authSession.findFirst({ where: { id: sessionId, userId } });
    if (!s) throw new UnauthorizedException({ message: 'Session not found', errorCode: 'SESSION_NOT_FOUND' });
    await this.revokeSession(sessionId);
  }

  // ── password / email flows ──────────────────────────────────────────
  async forgotPassword(collegeCode: string, email: string): Promise<void> {
    const college = await this.prisma.college.findUnique({ where: { code: collegeCode.toUpperCase() } });
    const user = college
      ? await this.prisma.user.findFirst({ where: { collegeId: college.id, email: email.toLowerCase() } })
      : null;
    if (!user || user.status === UserStatus.INACTIVE) return; // identical response either way (no enumeration)
    const raw = await this.issueToken(user.id, OneTimeTokenType.PASSWORD_RESET, 60);
    await this.mail.enqueue({
      to: user.email,
      subject: 'Reset your College OS password',
      text: `Reset link (valid 1 hour): ${this.config.get('APP_URL')}/reset-password?token=${raw}`,
    });
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const t = await this.consumeToken(rawToken, OneTimeTokenType.PASSWORD_RESET);
    await this.prisma.user.update({
      where: { id: t.userId },
      data: { passwordHash: await this.hashPassword(newPassword), failedLoginAttempts: 0, lockedUntil: null },
    });
    await this.logoutAll(t.userId);
    await this.audit.log({ userId: t.userId, action: 'PASSWORD_RESET', entity: 'User', entityId: t.userId });
  }

  async sendVerification(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.emailVerifiedAt) return;
    const raw = await this.issueToken(user.id, OneTimeTokenType.EMAIL_VERIFY, 60 * 24);
    await this.mail.enqueue({
      to: user.email,
      subject: 'Verify your College OS email',
      text: `Verify link (valid 24h): ${this.config.get('APP_URL')}/verify-email?token=${raw}`,
    });
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const t = await this.consumeToken(rawToken, OneTimeTokenType.EMAIL_VERIFY);
    await this.prisma.user.update({
      where: { id: t.userId },
      data: { emailVerifiedAt: new Date(), status: UserStatus.ACTIVE },
    });
    await this.principals.invalidate(t.userId);
  }

  async changePassword(userId: string, current: string, next: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash || !(await bcrypt.compare(current, user.passwordHash))) throw invalid();
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await this.hashPassword(next) } });
    await this.logoutAll(userId);
    await this.audit.log({
      collegeId: user.collegeId,
      userId,
      action: 'PASSWORD_CHANGE',
      entity: 'User',
      entityId: userId,
    });
  }

  // ── internals ───────────────────────────────────────────────────────
  private async createSession(
    userId: string,
    collegeId: string | null,
    familyId: string,
    deviceName: string | undefined,
    meta: ClientMeta,
  ): Promise<TokenPair> {
    const sessionId = randomUUID();
    const secret = this.tokens.newRefreshSecret();
    const refreshToken = `${sessionId}.${secret}`;
    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId,
        familyId,
        refreshTokenHash: this.tokens.hash(refreshToken),
        deviceName,
        ip: meta.ip,
        userAgent: meta.userAgent?.slice(0, 255),
        expiresAt: new Date(Date.now() + this.tokens.refreshTtlMs()),
      },
    });
    return {
      accessToken: this.tokens.signAccess(userId, sessionId, collegeId),
      refreshToken,
      expiresIn: this.config.get('JWT_ACCESS_TTL'),
      sessionId,
    };
  }

  private async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.markRevoked(sessionId);
  }
  private async revokeFamily(familyId: string): Promise<void> {
    const sessions = await this.prisma.authSession.findMany({
      where: { familyId, revokedAt: null },
      select: { id: true },
    });
    await this.prisma.authSession.updateMany({ where: { familyId, revokedAt: null }, data: { revokedAt: new Date() } });
    await Promise.all(sessions.map((s) => this.markRevoked(s.id)));
  }
  /** Lets the access-token guard reject tokens of a revoked session without a DB hit. */
  private markRevoked(sessionId: string) {
    return this.redis.client.set(revokedKey(sessionId), '1', 'EX', 24 * 3600);
  }

  private async registerFailure(userId: string, attempts: number): Promise<void> {
    const lock = attempts >= MAX_FAILED_ATTEMPTS;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: lock ? 0 : attempts,
        lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : undefined,
      },
    });
    if (lock) await this.audit.log({ userId, action: 'ACCOUNT_LOCKED', entity: 'User', entityId: userId });
  }

  private recordAttempt(
    collegeId: string | null,
    loginId: string,
    userId: string | null,
    success: boolean,
    meta: ClientMeta,
  ) {
    return this.prisma.loginAttempt.create({
      data: {
        collegeId,
        loginId: loginId.slice(0, 64),
        userId,
        success,
        ip: meta.ip,
        userAgent: meta.userAgent?.slice(0, 255),
      },
    });
  }

  private async issueToken(userId: string, type: OneTimeTokenType, ttlMinutes: number): Promise<string> {
    const raw = randomBytes(32).toString('base64url');
    await this.prisma.oneTimeToken.create({
      data: { userId, type, tokenHash: sha256(raw), expiresAt: new Date(Date.now() + ttlMinutes * 60_000) },
    });
    return raw;
  }

  private async consumeToken(raw: string, type: OneTimeTokenType) {
    const t = await this.prisma.oneTimeToken.findUnique({ where: { tokenHash: sha256(raw) } });
    if (!t || t.type !== type || t.usedAt || t.expiresAt < new Date()) {
      throw new UnauthorizedException({ message: 'Invalid or expired token', errorCode: 'TOKEN_INVALID' });
    }
    await this.prisma.oneTimeToken.update({ where: { id: t.id }, data: { usedAt: new Date() } });
    return t;
  }
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
