import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { StorageProvider, UploadInput } from '../storage-provider.interface';

// A chave tem UUID (nunca é sobrescrita), então o arquivo é imutável: cache longo (RNF009).
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

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

  async upload({
    buffer,
    folder,
    id,
    extension,
    mimetype,
  }: UploadInput): Promise<string> {
    // R2 não acrescenta extensão: ela entra na chave.
    const key = `${folder}/${id}.${extension}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
        CacheControl: CACHE_CONTROL,
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
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  private requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(
        `Variável de ambiente ausente: ${name} (necessária para STORAGE_PROVIDER=r2)`,
      );
    }
    return value;
  }
}