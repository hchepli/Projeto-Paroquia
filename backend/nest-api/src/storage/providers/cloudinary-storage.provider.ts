import { Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { StorageProvider, UploadInput } from '../storage-provider.interface';

export class CloudinaryStorageProvider implements StorageProvider {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);
  private readonly cloudName: string;

  constructor() {
    this.cloudName = this.requireEnv('CLOUDINARY_CLOUD_NAME');
    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.requireEnv('CLOUDINARY_API_KEY'),
      api_secret: this.requireEnv('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  upload({ buffer, folder, id }: UploadInput): Promise<string> {
    // Sem extensão no public_id: o Cloudinary acrescenta a do formato.
    // Resultado: .../albums/3/<uuid>.jpg (antes saía .jpeg.jpg).
    const publicId = `${folder}/${id}`;
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { public_id: publicId, resource_type: 'image', overwrite: false },
        (error, result) => {
          if (error || !result) {
            return reject(
              error ??
                new Error('Upload para o Cloudinary falhou sem detalhes.'),
            );
          }
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });
  }

  async deleteByUrl(url: string): Promise<void> {
    // Só apaga URLs do próprio cloud (mesma regra de segurança do R2).
    const prefix = `https://res.cloudinary.com/${this.cloudName}/`;
    if (!url.startsWith(prefix)) {
      throw new Error(
        `URL não pertence ao cloud configurado (${this.cloudName}); não será apagada.`,
      );
    }

    const publicId = this.extractPublicId(url);
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true,
    });

    // destroy() NÃO lança em "not found": é preciso checar o resultado.
    if (response?.result === 'ok') return;
    if (response?.result === 'not found') {
      // Objetivo atingido (arquivo ausente); não gera ORPHAN_FILE falso.
      this.logger.warn(`Cloudinary: arquivo já inexistente (${publicId}).`);
      return;
    }
    throw new Error(
      `Cloudinary destroy retornou "${response?.result}" para ${publicId}.`,
    );
  }

  /**
   * Remove só a ÚLTIMA extensão. Funciona para URLs novas (.../uuid.jpg)
   * e antigas (.../uuid-nome.jpeg.jpg -> public_id "uuid-nome.jpeg"),
   * então fotos antigas continuam apagáveis sem migração.
   */
  extractPublicId(url: string): string {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    if (!match) {
      throw new Error(
        `Não foi possível extrair o public_id da URL do Cloudinary: "${url}"`,
      );
    }
    return match[1];
  }

  private requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(
        `Variável de ambiente ausente: ${name} (necessária para STORAGE_PROVIDER=cloudinary)`,
      );
    }
    return value;
  }
}