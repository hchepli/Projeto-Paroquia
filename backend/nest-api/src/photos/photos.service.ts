// src/photos/photos.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { Prisma } from '../../generated/prisma/client';

// Interface local mínima (evita depender dos tipos do @types/multer).
export interface UploadedFileLike {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size?: number;
}

interface CreatePhotoInput {
  albumId: number;
  isCover?: boolean;
}

@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(input: CreatePhotoInput, file: UploadedFileLike) {
    // Confere o álbum ANTES do upload: evita subir e apagar arquivo à toa.
    const album = await this.prismaService.album.findUnique({
      where: { id: input.albumId },
      select: { id: true },
    });
    if (!album) throw new NotFoundException('Álbum informado não existe.');

    // StorageService valida o CONTEÚDO (RNF008): 400 se não for imagem válida.
    const url = await this.storageService.uploadFile(
      file.buffer,
      `albums/${input.albumId}`,
      file.originalname,
      file.mimetype,
    );

    try {
      // RN010 (capa única) no service, em transaction:
      // - 1ª foto do álbum vira capa; - capa nova desmarca as demais.
      // Não protege 2 requests simultâneos (Bloco 6: índice único parcial).
      return await this.prismaService.$transaction(async (tx) => {
        const existingCover = await tx.photo.count({
          where: { albumId: input.albumId, isCover: true },
        });
        const shouldBeCover = (input.isCover ?? false) || existingCover === 0;

        if (shouldBeCover) {
          await tx.photo.updateMany({
            where: { albumId: input.albumId, isCover: true },
            data: { isCover: false },
          });
        }

        return tx.photo.create({
          data: { albumId: input.albumId, url, isCover: shouldBeCover },
        });
      });
    } catch (error) {
      // Falhou no banco → desfaz o upload (sem órfão). Se a compensação
      // também falhar, loga a URL para limpeza manual.
      await this.storageService.deleteFile(url).catch((e) =>
        this.logger.error(
          `ORPHAN_FILE album=${input.albumId} url=${url}`,
          e instanceof Error ? e.stack : String(e),
        ),
      );

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new NotFoundException('Álbum informado não existe.');
      }
      throw error;
    }
  }

  findAll(albumId?: number) {
    return this.prismaService.photo.findMany({
      where: albumId !== undefined ? { albumId } : undefined,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async findOne(id: number) {
    const photo = await this.prismaService.photo.findUnique({ where: { id } });
    if (!photo) throw new NotFoundException('Foto não encontrada');
    return photo;
  }

  // Única alteração permitida: marcar como capa (RN010).
  async update(id: number, dto: UpdatePhotoDto) {
    const photo = await this.findOne(id);

    if (!dto.isCover) {
      throw new BadRequestException(
        'Não é possível desmarcar a capa diretamente. Marque outra foto como capa para trocá-la.',
      );
    }
    if (photo.isCover) return photo;

    return this.prismaService.$transaction(async (tx) => {
      await tx.photo.updateMany({
        where: { albumId: photo.albumId, isCover: true },
        data: { isCover: false },
      });
      return tx.photo.update({ where: { id }, data: { isCover: true } });
    });
  }

  // Remove do banco (transaction) e depois do storage. Se era a capa,
  // a foto mais antiga restante assume.
  async remove(id: number) {
    const photo = await this.findOne(id);

    const deleted = await this.prismaService.$transaction(async (tx) => {
      const removed = await tx.photo.delete({ where: { id } });

      if (photo.isCover) {
        const next = await tx.photo.findFirst({
          where: { albumId: photo.albumId },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        });
        if (next) {
          await tx.photo.update({ where: { id: next.id }, data: { isCover: true } });
        }
      }
      return removed;
    });

    try {
      await this.storageService.deleteFile(photo.url);
    } catch (error) {
      this.logger.error(
        `ORPHAN_FILE album=${photo.albumId} photo=${id} url=${photo.url}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return deleted;
  }
}