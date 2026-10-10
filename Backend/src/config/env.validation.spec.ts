import { validateEnv } from './env.validation';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('validateEnv', () => {
  it('accepts a valid config and applies defaults', () => {
    const env = validateEnv({ ...valid });
    expect(env.PORT).toBe(3000);
    expect(env.AI_PROVIDER).toBe('openai');
  });

  it('coerces numeric strings', () => {
    expect(validateEnv({ ...valid, PORT: '8080' }).PORT).toBe(8080);
  });

  it('rejects short JWT secrets', () => {
    expect(() => validateEnv({ ...valid, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });

  it('treats empty strings as unset (missing required => error)', () => {
    expect(() => validateEnv({ ...valid, DATABASE_URL: '' })).toThrow(/DATABASE_URL/);
  });

  it('requires CORS_ORIGINS in production', () => {
    expect(() => validateEnv({ ...valid, NODE_ENV: 'production' })).toThrow(/CORS_ORIGINS/);
    expect(validateEnv({ ...valid, NODE_ENV: 'production', CORS_ORIGINS: 'https://a.edu' })).toBeDefined();
  });

  it('rejects an unknown AI provider', () => {
    expect(() => validateEnv({ ...valid, AI_PROVIDER: 'skynet' })).toThrow(/AI_PROVIDER/);
  });
});
