import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { StorageDriver } from './storage.types';

/** Works for AWS S3 and Cloudflare R2 (set S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com, S3_REGION=auto). */
export class S3Storage implements StorageDriver {
  private readonly client: S3Client;
  constructor(
    private readonly bucket: string,
    opts: { region: string; endpoint?: string; accessKeyId: string; secretAccessKey: string },
  ) {
    this.client = new S3Client({
      region: opts.region,
      endpoint: opts.endpoint,
      forcePathStyle: !!opts.endpoint,
      credentials: { accessKeyId: opts.accessKeyId, secretAccessKey: opts.secretAccessKey },
    });
  }
  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: undefined,
      }),
    );
  }
  async get(key: string): Promise<Buffer> {
    const r = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return Buffer.from(await (r.Body as { transformToByteArray(): Promise<Uint8Array> }).transformToByteArray());
  }
  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
