// src/storage/providers/r2-storage.provider.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { StorageProvider } from '../storage-provider.interface';

export class R2StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    const accountId = this.requireEnv('R2_ACCOUNT_ID');
    const accessKeyId = this.requireEnv('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.requireEnv('R2_SECRET_ACCESS_KEY');
    this.bucket = this.requireEnv('R2_BUCKET_NAME');
    this.publicUrl = this.requireEnv('R2_PUBLIC_URL').replace(/\/$/, '');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async upload(buffer: Buffer, key: string, mimetype: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      }),
    );
    return `${this.publicUrl}/${key}`;
  }

  async deleteByUrl(url: string): Promise<void> {
    const prefix = `${this.publicUrl}/`;
    if (!url.startsWith(prefix)) {
      throw new Error(
        `URL "${url}" não pertence ao domínio público configurado (${this.publicUrl}) — não é possível extrair a key do R2.`,
      );
    }
    const key = url.slice(prefix.length);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  private requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Variável de ambiente ausente: ${name} (necessária para STORAGE_PROVIDER=r2)`);
    }
    return value;
  }
}
