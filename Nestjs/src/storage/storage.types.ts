export interface StorageDriver {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
export const STORAGE_DRIVER = Symbol('STORAGE_DRIVER');

/** Integration point for ClamAV / cloud AV. Must throw (or return false) for infected content. */
export interface MalwareScanner {
  isClean(body: Buffer, filename: string): Promise<boolean>;
}
export const MALWARE_SCANNER = Symbol('MALWARE_SCANNER');
