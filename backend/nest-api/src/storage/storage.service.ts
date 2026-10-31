import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { StorageProvider } from './storage-provider.interface';
import { R2StorageProvider } from './providers/r2-storage.provider';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';

// RNF009 - otimização no backend antes do upload (só encolhe, mantém o formato).
const MAX_WIDTH_PX = 1920;
const QUALITY = 80;
// Proteção contra "decompression bomb": PNG pequeno que expande para GBs na memória.
const MAX_INPUT_PIXELS = 50_000_000; // ~50MP (câmeras de celular ficam abaixo)

// Formato detectado pelo sharp (conteúdo real) -> MIME e extensão.
const FORMATS: Record<string, { mime: string; extension: string }> = {
  jpeg: { mime: 'image/jpeg', extension: 'jpg' },
  png: { mime: 'image/png', extension: 'png' },
  webp: { mime: 'image/webp', extension: 'webp' },
};

interface OptimizedImage {
  buffer: Buffer;
  mime: string;
  extension: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
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
   * Valida o conteúdo (RNF008), otimiza (RNF009) e envia. Retorna a URL pública.
   * O nome original do cliente é IGNORADO: a chave usa UUID + extensão do formato
   * detectado (sem colisão, sem path traversal, sem estourar o VarChar(255) da URL).
   * O parâmetro permanece só por compatibilidade com os chamadores atuais.
   */
  async uploadFile(
    buffer: Buffer,
    folder: string,
    _originalFilename: string,
    mimetype: string,
  ): Promise<string> {
    const image = await this.validateAndOptimizeImage(buffer, mimetype);
    return this.provider.upload({
      buffer: image.buffer,
      folder,
      id: randomUUID(),
      extension: image.extension,
      mimetype: image.mime,
    });
  }

  /** Remove um arquivo do storage a partir da URL salva no banco. */
  async deleteFile(url: string): Promise<void> {
    await this.provider.deleteByUrl(url);
  }

  private async validateAndOptimizeImage(
    buffer: Buffer,
    mimetype: string,
  ): Promise<OptimizedImage> {
    const options = { limitInputPixels: MAX_INPUT_PIXELS };

    let format: string | undefined;
    try {
      format = (await sharp(buffer, options).metadata()).format;
    } catch {
      throw new BadRequestException(
        'O arquivo enviado não é uma imagem válida.',
      );
    }

    const detected = format ? FORMATS[format] : undefined;
    if (!detected) {
      throw new BadRequestException(
        'Formato de imagem não permitido. Use JPEG, PNG ou WEBP.',
      );
    }
    if (detected.mime !== mimetype) {
      throw new BadRequestException(
        'O conteúdo do arquivo não corresponde ao tipo informado.',
      );
    }

    try {
      // .rotate() aplica a orientação EXIF antes de os metadados (incl. GPS) serem descartados.
      let pipeline = sharp(buffer, options)
        .rotate()
        .resize({ width: MAX_WIDTH_PX, withoutEnlargement: true });

      switch (detected.mime) {
        case 'image/jpeg':
          pipeline = pipeline.jpeg({ quality: QUALITY });
          break;
        case 'image/png':
          pipeline = pipeline.png({ quality: QUALITY });
          break;
        case 'image/webp':
          pipeline = pipeline.webp({ quality: QUALITY });
          break;
      }

      return { buffer: await pipeline.toBuffer(), ...detected };
    } catch (error) {
      this.logger.error(
        'Falha ao otimizar imagem',
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException(
        'Não foi possível processar a imagem enviada.',
      );
    }
  }
}