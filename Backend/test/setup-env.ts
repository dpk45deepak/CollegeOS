// Runs before any module is imported so env validation sees these values.
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.DATABASE_URL ??= 'postgresql://x:x@localhost:5432/x';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';
process.env.JWT_REFRESH_SECRET = 'test-refresh-test-refresh-test-refresh-1';
process.env.STORAGE_LOCAL_PATH = '/tmp/college-os-test-uploads';
