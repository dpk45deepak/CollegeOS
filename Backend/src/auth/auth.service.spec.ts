import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService, LOCK_MINUTES, MAX_FAILED_ATTEMPTS } from './auth.service';

const HASH = bcrypt.hashSync('Correct-horse-9', 4);
const baseUser = {
  id: 'u1',
  collegeId: 'c1',
  loginId: 'CSE1',
  email: 'a@b.c',
  passwordHash: HASH,
  status: 'ACTIVE',
  failedLoginAttempts: 0,
  lockedUntil: null,
};

function build(user: Record<string, unknown> | null, session?: Record<string, unknown>) {
  const prisma = {
    college: { findUnique: jest.fn(async () => ({ id: 'c1' })) },
    user: {
      findFirst: jest.fn(async () => user),
      findUnique: jest.fn(async () => user),
      update: jest.fn(async () => ({})),
    },
    loginAttempt: { create: jest.fn(async () => ({})) },
    authSession: {
      create: jest.fn(async () => ({})),
      findUnique: jest.fn(async () => session ?? null),
      findMany: jest.fn(async () => [{ id: 's1' }, { id: 's2' }]),
      updateMany: jest.fn(async () => ({ count: 1 })),
    },
    oneTimeToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  };
  const tokens = {
    signAccess: () => 'access',
    newRefreshSecret: () => 'secret',
    hash: (s: string) => `h(${s})`,
    safeEqual: (a: string, b: string) => a === b,
    refreshTtlMs: () => 1000,
  };
  const client = { set: jest.fn(async () => 'OK') };
  const redis = {
    client,
    safeSet: jest.fn(async (key: string, val: string, ...args: (string | number)[]) => {
      // @ts-expect-error mock call
      return (await client.set(key, val, ...args)) === 'OK';
    }),
  };
  const audit = { log: jest.fn(async () => undefined) };
  const svc = new AuthService(
    prisma as never,
    tokens as never,
    { get: () => '15m' } as never,
    redis as never,
    audit as never,
    { enqueue: jest.fn() } as never,
    { invalidate: jest.fn() } as never,
  );
  return { svc, prisma, redis, audit };
}

describe('AuthService login', () => {
  it('issues tokens for valid credentials and resets the failure counter', async () => {
    const { svc, prisma } = build({ ...baseUser, failedLoginAttempts: 3 });
    const r = await svc.login({ collegeCode: 'sdcet', loginId: 'CSE1', password: 'Correct-horse-9' }, {});
    expect(r.accessToken).toBe('access');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ failedLoginAttempts: 0, lockedUntil: null }) }),
    );
  });
  it('gives the same error for unknown user and wrong password (no account enumeration)', async () => {
    const a = await build(null)
      .svc.login({ collegeCode: 'x', loginId: 'nobody', password: 'x' }, {})
      .catch((e) => e);
    const b = await build(baseUser)
      .svc.login({ collegeCode: 'x', loginId: 'CSE1', password: 'wrong' }, {})
      .catch((e) => e);
    expect(a.getResponse()).toEqual(b.getResponse());
    expect(a.getResponse().errorCode).toBe('INVALID_CREDENTIALS');
  });
  it(`locks the account for ${LOCK_MINUTES} min after ${MAX_FAILED_ATTEMPTS} failures`, async () => {
    const { svc, prisma, audit } = build({ ...baseUser, failedLoginAttempts: MAX_FAILED_ATTEMPTS - 1 });
    await expect(svc.login({ collegeCode: 'x', loginId: 'CSE1', password: 'bad' }, {})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    const data = (prisma.user.update.mock.calls[0] as unknown as [{ data: { lockedUntil: Date } }])[0].data;
    expect(data.lockedUntil.getTime()).toBeGreaterThan(Date.now() + (LOCK_MINUTES - 1) * 60_000);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ACCOUNT_LOCKED' }));
  });
  it('refuses a locked account even with the right password (423)', async () => {
    const { svc } = build({ ...baseUser, lockedUntil: new Date(Date.now() + 60_000) });
    await expect(
      svc.login({ collegeCode: 'x', loginId: 'CSE1', password: 'Correct-horse-9' }, {}),
    ).rejects.toMatchObject({ status: 423 });
  });
  it('blocks unverified and inactive accounts', async () => {
    await expect(
      build({ ...baseUser, status: 'PENDING_VERIFICATION' }).svc.login(
        { collegeCode: 'x', loginId: 'a', password: 'Correct-horse-9' },
        {},
      ),
    ).rejects.toMatchObject({ response: { errorCode: 'EMAIL_NOT_VERIFIED' } });
    await expect(
      build({ ...baseUser, status: 'INACTIVE' }).svc.login(
        { collegeCode: 'x', loginId: 'a', password: 'Correct-horse-9' },
        {},
      ),
    ).rejects.toMatchObject({ response: { errorCode: 'ACCOUNT_INACTIVE' } });
  });
  it('never stores or compares plaintext passwords', async () => {
    expect(await build(null).svc.hashPassword('Correct-horse-9')).toMatch(/^\$2[aby]\$/);
  });
});

describe('AuthService refresh-token rotation', () => {
  const session = {
    id: 'sess',
    userId: 'u1',
    familyId: 'fam',
    refreshTokenHash: 'h(sess.secret)',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    deviceName: 'Pixel',
  };
  it('rotates: old session revoked, new session created in the same family', async () => {
    const { svc, prisma } = build(baseUser, session);
    const r = await svc.refresh('sess.secret', {});
    expect(r.refreshToken).not.toBe('sess.secret');
    expect(prisma.authSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sess', revokedAt: null } }),
    );
    expect(prisma.authSession.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ familyId: 'fam' }) }),
    );
  });
  it('detects reuse of a rotated token and revokes the whole family', async () => {
    const { svc, prisma, redis } = build(baseUser, { ...session, revokedAt: new Date() });
    await expect(svc.refresh('sess.secret', {})).rejects.toMatchObject({ response: { errorCode: 'REFRESH_REUSED' } });
    expect(prisma.authSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { familyId: 'fam', revokedAt: null } }),
    );
    expect(redis.client.set).toHaveBeenCalledTimes(2); // both live sessions blacklisted for access-token checks
  });
  it('rejects a token whose secret does not match', async () => {
    await expect(build(baseUser, session).svc.refresh('sess.WRONG', {})).rejects.toMatchObject({
      response: { errorCode: 'REFRESH_INVALID' },
    });
  });
  it('rejects expired refresh tokens', async () => {
    await expect(
      build(baseUser, { ...session, expiresAt: new Date(Date.now() - 1) }).svc.refresh('sess.secret', {}),
    ).rejects.toMatchObject({ response: { errorCode: 'REFRESH_EXPIRED' } });
  });
});
