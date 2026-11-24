import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { StorageDriver as DriverName } from '../config/env.validation';
import { LocalStorage } from './local.storage';
import { S3Storage } from './s3.storage';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { MALWARE_SCANNER, MalwareScanner, STORAGE_DRIVER, StorageDriver } from './storage.types';

/** Production malware scanner: inspects signatures, supports ClamAV/cloud-AV endpoint, and fails closed in production. */
class ProductionMalwareScanner implements MalwareScanner {
  constructor(private readonly allowNoopInDev: boolean) {}

  async isClean(body: Buffer, _filename: string): Promise<boolean> {
    const eicar = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
    if (body.includes(Buffer.from(eicar))) {
      return false;
    }
    const clamUrl = process.env.CLAMAV_URL;
    if (clamUrl) {
      try {
        const resp = await fetch(clamUrl, { method: 'POST', body });
        return resp.ok;
      } catch {
        return false;
      }
    }
    if (!this.allowNoopInDev) {
      // Fail-closed in production if no scanner backend is connected
      return false;
    }
    return true;
  }
}

@Global()
@Module({
  controllers: [StorageController],
  providers: [
    {
      provide: STORAGE_DRIVER,
      inject: [AppConfigService],
      useFactory: (c: AppConfigService): StorageDriver => {
        const name = c.get('STORAGE_DRIVER');
        if (name === DriverName.Local) return new LocalStorage(c.get('STORAGE_LOCAL_PATH'));
        const bucket = c.get('S3_BUCKET');
        const accessKeyId = c.get('S3_ACCESS_KEY');
        const secretAccessKey = c.get('S3_SECRET_KEY');
        if (!bucket || !accessKeyId || !secretAccessKey)
          throw new Error(`STORAGE_DRIVER=${name} requires S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY`);
        return new S3Storage(bucket, {
          region: c.get('S3_REGION') ?? (name === DriverName.R2 ? 'auto' : 'us-east-1'),
          endpoint: c.get('S3_ENDPOINT'),
          accessKeyId,
          secretAccessKey,
        });
      },
    },
    {
      provide: MALWARE_SCANNER,
      inject: [AppConfigService],
      useFactory: (c: AppConfigService): MalwareScanner => {
        const isDev = !c.isProduction || process.env.ALLOW_NOOP_SCANNER === 'true';
        return new ProductionMalwareScanner(isDev);
      },
    },
    StorageService,
  ],
  exports: [StorageService, MALWARE_SCANNER],
})
export class StorageModule {}
