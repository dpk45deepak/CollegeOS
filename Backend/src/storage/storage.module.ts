import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { StorageDriver as DriverName } from '../config/env.validation';
import { LocalStorage } from './local.storage';
import { S3Storage } from './s3.storage';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { MALWARE_SCANNER, MalwareScanner, STORAGE_DRIVER, StorageDriver } from './storage.types';

/** Default scanner: accepts everything. Replace with a ClamAV/cloud-AV implementation in production. */
class NoopScanner implements MalwareScanner {
  async isClean(): Promise<boolean> {
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
    { provide: MALWARE_SCANNER, useClass: NoopScanner },
    StorageService,
  ],
  exports: [StorageService, MALWARE_SCANNER],
})
export class StorageModule {}
