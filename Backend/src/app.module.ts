import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { randomUUID } from 'node:crypto';
import { LoggerModule } from 'nestjs-pino';
import { AcademicModule } from './academic/academic.module';
import { AccessModule } from './access/access.module';
import { AdminModule } from './admin/admin.module';
import { AiCoreModule } from './ai/ai-core.module';
import { AiModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CampusModule } from './campus/campus.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { ComplaintsModule } from './complaints/complaints.module';
import { AppConfigService } from './config/app-config.service';
import { AppConfigModule } from './config/config.module';
import { DocumentsModule } from './documents/documents.module';
import { ExaminationsModule } from './examinations/examinations.module';
import { FeesModule } from './fees/fees.module';
import { HealthModule } from './health/health.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PlacementsModule } from './placements/placements.module';
import { PortalModule } from './portal/portal.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RedisModule } from './redis/redis.module';
import { ReportsModule } from './reports/reports.module';
import { ScholarshipsModule } from './scholarships/scholarships.module';
import { SearchModule } from './search/search.module';
import { SecurityModule } from './security/security.module';
import { StorageModule } from './storage/storage.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { TimetableModule } from './timetable/timetable.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.get('LOG_LEVEL'),
          genReqId: (req, res) => {
            const inbound = req.headers['x-request-id'];
            const id = typeof inbound === 'string' && /^[A-Za-z0-9._-]{8,128}$/.test(inbound) ? inbound : randomUUID();
            res.setHeader('x-request-id', id);
            return id;
          },
          // Never let credentials or personal data reach the logs.
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'res.headers["set-cookie"]',
              'req.body.password',
              'req.body.newPassword',
              'req.body.currentPassword',
              'req.body.refreshToken',
              'req.body.token',
              'req.body.initialPassword',
              'req.body.adminPassword',
            ],
            censor: '[REDACTED]',
          },
          transport: (() => {
            if (config.isProduction) return undefined;
            try {
              require.resolve('pino-pretty');
              return { target: 'pino-pretty', options: { singleLine: true } };
            } catch {
              return undefined;
            }
          })(),
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (c: AppConfigService) => [
        { ttl: c.get('THROTTLE_TTL_SECONDS') * 1000, limit: c.get('THROTTLE_LIMIT') },
      ],
    }),
    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.', maxListeners: 50 }),
    // infrastructure
    PrismaModule,
    RedisModule,
    QueueModule,
    SecurityModule,
    AccessModule,
    AuditModule,
    StorageModule,
    AiCoreModule,
    NotificationsModule,
    RealtimeModule,
    HealthModule,
    // domain
    AuthModule,
    UsersModule,
    AcademicModule,
    StudentsModule,
    TeachersModule,
    AttendanceModule,
    TimetableModule,
    AssignmentsModule,
    ExaminationsModule,
    FeesModule,
    ScholarshipsModule,
    PlacementsModule,
    ComplaintsModule,
    CampusModule,
    MessagingModule,
    DocumentsModule,
    PortalModule,
    // intelligence
    AiModule,
    AnalyticsModule,
    ReportsModule,
    SearchModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
