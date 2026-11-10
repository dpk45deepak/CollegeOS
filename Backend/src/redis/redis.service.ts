import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;
  private _isHealthy = true;
  private _lastFailureTime = 0;
  private _loggedWarning = false;
  private readonly COOLDOWN_MS = 60_000;

  constructor(config: AppConfigService) {
    const redisUrl = config.get('REDIS_URL');
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1500,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (process.env.VERCEL || times > 1) {
          this._isHealthy = false;
          this._lastFailureTime = Date.now();
          return null;
        }
        return 2000;
      },
      reconnectOnError: () => false,
    });

    this.client.on('error', (err) => {
      this._isHealthy = false;
      this._lastFailureTime = Date.now();
      if (!this._loggedWarning) {
        this.logger.warn(`Redis unavailable (${err.message}); active fallback to in-memory/PostgreSQL mode`);
        this._loggedWarning = true;
      }
    });

    this.client.on('connect', () => {
      this._isHealthy = true;
      this._loggedWarning = false;
      this.logger.log('Redis connected successfully');
    });
  }

  isHealthy(): boolean {
    if (!this._isHealthy) {
      if (Date.now() - this._lastFailureTime < this.COOLDOWN_MS) {
        return false;
      }
    }
    return this._isHealthy;
  }

  async safeExists(key: string): Promise<boolean> {
    if (!this.isHealthy()) return false;
    try {
      return (await this.client.exists(key)) === 1;
    } catch {
      this._isHealthy = false;
      this._lastFailureTime = Date.now();
      return false;
    }
  }

  async safeSet(key: string, value: string, ...args: any[]): Promise<boolean> {
    if (!this.isHealthy()) return false;
    try {
      const res = await (this.client as any).set(key, value, ...args);
      return res === 'OK';
    } catch {
      this._isHealthy = false;
      this._lastFailureTime = Date.now();
      return false;
    }
  }

  async safeGet(key: string): Promise<string | null> {
    if (!this.isHealthy()) return null;
    try {
      return await this.client.get(key);
    } catch {
      this._isHealthy = false;
      this._lastFailureTime = Date.now();
      return null;
    }
  }

  async safeIncr(key: string): Promise<number | null> {
    if (!this.isHealthy()) return null;
    try {
      return await this.client.incr(key);
    } catch {
      this._isHealthy = false;
      this._lastFailureTime = Date.now();
      return null;
    }
  }

  async safeDel(key: string): Promise<boolean> {
    if (!this.isHealthy()) return false;
    try {
      return (await this.client.del(key)) > 0;
    } catch {
      this._isHealthy = false;
      this._lastFailureTime = Date.now();
      return false;
    }
  }

  async ping(): Promise<string> {
    if (!this.isHealthy()) {
      throw new Error('Redis is offline');
    }
    return this.client.ping();
  }

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.client.status === 'ready') {
        await this.client.quit();
      } else {
        this.client.disconnect();
      }
    } catch {
      // safe cleanup
    }
  }
}
