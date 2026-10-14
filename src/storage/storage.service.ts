// src/storage/storage.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { StorageProvider } from './storage-provider.interface';
import { R2StorageProvider } from './providers/r2-storage.provider';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';

// RNF009 - otimização de imagem no backend antes do upload.
// Redimensiona (só encolhe) e comprime, mantendo o formato original.
const MAX_WIDTH_PX = 1920;
const JPEG_QUALITY = 80;
const PNG_QUALITY = 80;
const WEBP_QUALITY = 80;

// Formato detectado pelo sharp (conteúdo real) → MIME esperado.
const FORMAT_TO_MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

@Injectable()
export class StorageService {
  private readonly provider: StorageProvider;

  constructor() {
    // Troca de provider: mudar STORAGE_PROVIDER no .env.
    const providerName = (process.env.STORAGE_PROVIDER ?? 'r2').toLowerCase();

    switch (providerName) {
      case 'r2':
        this.provider = new R2StorageProvider();
        break;
      case 'cloudinary':
        this.provider = new CloudinaryStorageProvider();
        break;
      default:
        throw new Error(
          `STORAGE_PROVIDER="${providerName}" inválido. Use "r2" ou "cloudinary".`,
        );
    }
  }

  /**
   * Valida o conteúdo, otimiza e faz upload. Retorna a URL pública.
   * Lança BadRequestException se o arquivo não for uma imagem válida
   * (RNF008) — nada é enviado ao storage nesse caso.
   */
  async uploadFile(
    buffer: Buffer,
    folder: string,
    originalFilename: string,
    mimetype: string,
  ): Promise<string> {
    const optimizedBuffer = await this.validateAndOptimizeImage(buffer, mimetype);
    const sanitized = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${folder}/${randomUUID()}-${sanitized}`;
    return this.provider.upload(optimizedBuffer, key, mimetype);
  }

  /** Remove um arquivo do storage a partir da URL salva no banco. */
  async deleteFile(url: string): Promise<void> {
    await this.provider.deleteByUrl(url);
  }

  /**
   * RNF008: valida pelo CONTEÚDO (não só pelo MIME declarado pelo cliente)
   * e falha de forma fechada — nunca sobe o arquivo original sem validar.
   * RNF009: redimensiona (só encolhe) e comprime.
   */
  private async validateAndOptimizeImage(buffer: Buffer, mimetype: string): Promise<Buffer> {
    let format: string | undefined;
    try {
      format = (await sharp(buffer).metadata()).format;
    } catch {
      throw new BadRequestException('O arquivo enviado não é uma imagem válida.');
    }

    const detectedMime = format ? FORMAT_TO_MIME[format] : undefined;
    if (!detectedMime) {
      throw new BadRequestException('Formato de imagem não permitido. Use JPEG, PNG ou WEBP.');
    }
    if (detectedMime !== mimetype) {
      throw new BadRequestException(
        'O conteúdo do arquivo não corresponde ao tipo informado.',
      );
    }

    try {
      // .rotate() sem argumentos aplica a orientação EXIF antes de o sharp
      // descartar os metadados (evita foto de celular ficar deitada).
      let pipeline = sharp(buffer)
        .rotate()
        .resize({ width: MAX_WIDTH_PX, withoutEnlargement: true });

      switch (detectedMime) {
        case 'image/jpeg':
          pipeline = pipeline.jpeg({ quality: JPEG_QUALITY });
          break;
        case 'image/png':
          pipeline = pipeline.png({ quality: PNG_QUALITY });
          break;
        case 'image/webp':
          pipeline = pipeline.webp({ quality: WEBP_QUALITY });
          break;
      }

      return await pipeline.toBuffer();
    } catch (error) {
      console.error('Falha ao otimizar imagem:', error);
      throw new BadRequestException('Não foi possível processar a imagem enviada.');
    }
  }
}
