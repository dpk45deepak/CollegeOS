import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Boots the REAL dependency graph (all modules, guards, filters, queues, gateways) with Prisma stubbed.
 * Needs only Redis. Catches DI/circular-import mistakes, guard order, error envelope, validation and Swagger.
 */
describe('app smoke (no database)', () => {
  let app: INestApplication;
  const prismaStub = new Proxy(
    {},
    {
      get: (_t, prop) =>
        prop === 'then'
          ? undefined
          : new Proxy(() => undefined, {
              get: () => jest.fn().mockResolvedValue(null),
              apply: () => Promise.resolve(null),
            }),
    },
  );

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaStub)
      .compile();
    app = mod.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api', { exclude: ['health', 'health/ready'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
  });

  it('GET /health is public and unwrapped', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('protected routes reject anonymous callers with the standard error envelope', async () => {
    for (const path of [
      '/api/v1/students/me',
      '/api/v1/attendance/sessions',
      '/api/v1/documents',
      '/api/v1/ai/agents',
      '/api/v1/analytics/overview',
      '/api/v1/audit',
    ]) {
      const res = await request(app.getHttpServer()).get(path).expect(401);
      expect(res.body).toMatchObject({ success: false, statusCode: 401, errorCode: 'TOKEN_MISSING' });
      expect(res.body.requestId).toBeDefined();
      expect(res.headers['x-request-id']).toBe(res.body.requestId);
    }
  });

  it('rejects garbage bearer tokens', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/students/me')
      .set('authorization', 'Bearer not.a.jwt')
      .expect(401);
    expect(res.body.errorCode).toBe('TOKEN_INVALID');
  });

  it('login validates input (400 VALIDATION_ERROR) and rejects unknown fields', async () => {
    const bad = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ loginId: 5 }).expect(400);
    expect(bad.body.errorCode).toBe('VALIDATION_ERROR');
    const extra = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ loginId: 'a', password: 'b', isAdmin: true })
      .expect(400);
    expect(JSON.stringify(extra.body.message)).toContain('isAdmin');
  });

  it('payment webhooks are public but signature-checked (unknown gateway → 404, no auth error)', async () => {
    await request(app.getHttpServer()).post('/api/v1/webhooks/payments/unknown').send({}).expect(404);
  });

  it('a spoofed x-tenant-id cannot bypass authentication', async () => {
    await request(app.getHttpServer()).get('/api/v1/students').set('x-tenant-id', 'other-college').expect(401);
  });

  it('generates the OpenAPI document for every module', () => {
    const doc = SwaggerModule.createDocument(app, new DocumentBuilder().addBearerAuth().build());
    const paths = Object.keys(doc.paths);
    expect(paths.length).toBeGreaterThan(150);
    for (const p of [
      '/api/v1/auth/login',
      '/api/v1/attendance',
      '/api/v1/ai/chat',
      '/api/v1/ai/knowledge/ask',
      '/api/v1/complaints/route-preview',
      '/api/v1/analytics/attention',
    ])
      expect(paths).toContain(p);
  });
});
