import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    // In serverless (Vercel Functions), do not eagerly block app initialization.
    // Prisma connects lazily on the first query.
    if (!process.env.VERCEL) {
      try {
        await this.$connect();
        this.logger.log('Database connected');
      } catch (err: unknown) {
        this.logger.error(`Database connection deferred: ${(err as Error)?.message}`);
      }
    }
  }
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
