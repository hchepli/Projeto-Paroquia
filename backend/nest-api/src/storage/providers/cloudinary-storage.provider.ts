// src/storage/providers/cloudinary-storage.provider.ts
import { v2 as cloudinary } from 'cloudinary';
import { StorageProvider } from '../storage-provider.interface';

export class CloudinaryStorageProvider implements StorageProvider {
  constructor() {
    cloudinary.config({
      cloud_name: this.requireEnv('CLOUDINARY_CLOUD_NAME'),
      api_key: this.requireEnv('CLOUDINARY_API_KEY'),
      api_secret: this.requireEnv('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  upload(buffer: Buffer, key: string, _mimetype: string): Promise<string> {
    // A "key" (ex: "albums/3/uuid-foto") vira o public_id no Cloudinary,
    // incluindo a "pasta" via barras — assim mantemos a mesma organização
    // usada no R2, e a extração de volta a partir da URL fica previsível.
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: key,
          resource_type: 'image',
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            return reject(error ?? new Error('Upload para o Cloudinary falhou sem detalhes.'));
          }
          resolve(result.secure_url);
        },
      );
      uploadStream.end(buffer);
    });
  }

  async deleteByUrl(url: string): Promise<void> {
    const publicId = this.extractPublicId(url);
    await cloudinary.uploader.destroy(publicId);
  }

  /**
   * Extrai o public_id de uma URL do Cloudinary, ex:
   * https://res.cloudinary.com/<cloud>/image/upload/v1234567890/albums/3/uuid-foto.jpg
   * -> "albums/3/uuid-foto"
   */
  private extractPublicId(url: string): string {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    if (!match) {
      throw new Error(`Não foi possível extrair o public_id da URL do Cloudinary: "${url}"`);
    }
    return match[1];
  }

  private requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Variável de ambiente ausente: ${name} (necessária para STORAGE_PROVIDER=cloudinary)`);
    }
    return value;
  }
}
