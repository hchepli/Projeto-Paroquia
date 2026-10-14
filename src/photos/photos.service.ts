// src/photos/photos.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { Prisma } from '../../generated/prisma/client';

// Interface local mínima, só com os campos que este service usa
// (evita depender dos tipos do @types/multer, que já quebraram o build).
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
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(input: CreatePhotoInput, file: UploadedFileLike) {
    // O StorageService valida o CONTEÚDO (RNF008) e lança 400 se não for
    // uma imagem válida — nesse caso nada chega ao storage.
    const url = await this.storageService.uploadFile(
      file.buffer,
      `albums/${input.albumId}`,
      file.originalname,
      file.mimetype,
    );

    try {
      // RN010 (capa única), validada aqui no service, numa transaction:
      // - primeira foto do álbum vira capa automaticamente;
      // - se esta foto for capa, as demais do álbum são desmarcadas.
      // Obs.: não protege contra 2 requests simultâneos (Bloco 6 —
      // defesa final = índice único parcial no PostgreSQL).
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
      // Falhou no banco (ex: albumId inexistente) → desfaz o upload
      // para não deixar arquivo órfão no storage.
      await this.storageService.deleteFile(url).catch(() => undefined);

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException('Álbum informado não existe.');
        }
        if (error.code === 'P2002') {
          throw new ConflictException('Já existe uma foto com esse identificador.');
        }
      }
      throw error;
    }
  }

  findAll(albumId?: number) {
    return this.prismaService.photo.findMany({
      where: albumId !== undefined ? { albumId } : undefined,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: number) {
    const photo = await this.prismaService.photo.findUnique({ where: { id } });
    if (!photo) {
      throw new NotFoundException('Foto não encontrada');
    }
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

    if (photo.isCover) {
      return photo; // já é a capa, nada a fazer
    }

    return this.prismaService.$transaction(async (tx) => {
      await tx.photo.updateMany({
        where: { albumId: photo.albumId, isCover: true },
        data: { isCover: false },
      });
      return tx.photo.update({ where: { id }, data: { isCover: true } });
    });
  }

  // Remove a Photo (banco) e depois o arquivo físico (storage).
  // Se a foto removida era a capa, a foto mais antiga restante assume.
  async remove(id: number) {
    const photo = await this.findOne(id);

    const deleted = await this.prismaService.$transaction(async (tx) => {
      const removed = await tx.photo.delete({ where: { id } });

      if (photo.isCover) {
        const next = await tx.photo.findFirst({
          where: { albumId: photo.albumId },
          orderBy: { createdAt: 'asc' },
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
      // Não quebra a resposta se o arquivo já não existir — só loga.
      console.error(`Falha ao remover arquivo do storage para Photo ${id}:`, error);
    }

    return deleted;
  }
}
