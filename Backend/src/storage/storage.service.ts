import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AppConfigService } from '../config/app-config.service';
import { validateUpload } from './file-validation';
import { MALWARE_SCANNER, MalwareScanner, STORAGE_DRIVER, StorageDriver } from './storage.types';

export interface StoredFile {
  key: string;
  mime: string;
  sizeBytes: number;
  originalName: string;
}

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_DRIVER) private readonly driver: StorageDriver,
    @Inject(MALWARE_SCANNER) private readonly scanner: MalwareScanner,
    private readonly config: AppConfigService,
  ) {}

  get maxBytes(): number {
    return this.config.get('MAX_UPLOAD_MB') * 1024 * 1024;
  }

  /** Validate (size + magic bytes) → malware scan → store. Keys are tenant- and owner-prefixed. */
  async upload(opts: {
    collegeId: string;
    ownerId: string;
    scope: string;
    file: Buffer;
    originalName: string;
    allowedExts: string[];
  }): Promise<StoredFile> {
    const detected = validateUpload(opts.file, opts.allowedExts, this.maxBytes);
    if (!(await this.scanner.isClean(opts.file, opts.originalName))) {
      throw new ForbiddenException({ message: 'File rejected by malware scan', errorCode: 'MALWARE_DETECTED' });
    }
    const key = `${opts.collegeId}/${opts.scope}/${opts.ownerId}/${randomUUID()}.${detected.ext}`;
    await this.driver.put(key, opts.file, detected.mime);
    return { key, mime: detected.mime, sizeBytes: opts.file.length, originalName: opts.originalName };
  }

  /** Store server-generated content (e.g. exported reports) — no user-upload validation needed. */
  putRaw(key: string, body: Buffer, contentType: string) {
    return this.driver.put(key, body, contentType);
  }
  read(key: string) {
    return this.driver.get(key);
  }
  remove(key: string) {
    return this.driver.delete(key);
  }

  /** A key may be referenced by a user only if it was uploaded into their tenant (and, for owner scopes, by them). */
  assertKeysBelong(keys: string[], collegeId: string, ownerId?: string): void {
    for (const k of keys) {
      const parts = k.split('/');
      if (parts[0] !== collegeId || k.includes('..') || (ownerId && parts[2] !== ownerId)) {
        throw new ForbiddenException({ message: 'Invalid file reference', errorCode: 'FILE_REF_DENIED' });
      }
    }
  }
}
