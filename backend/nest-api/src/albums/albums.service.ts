// src/albums/albums.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Prisma } from '../../generated/prisma/client';
import { generateSlug } from '../common/utils/slug.util';

@Injectable()
export class AlbumsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(createAlbumDto: CreateAlbumDto) {
    const { slug, ...rest } = createAlbumDto;
    const finalSlug = slug ?? generateSlug(rest.title);

    try {
      return await this.prismaService.album.create({
        data: { ...rest, slug: finalSlug },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um álbum com esse nome');
      }
      throw error;
    }
  }

  findAll() {
    return this.prismaService.album.findMany();
  }

  async findOne(id: number) {
    const album = await this.prismaService.album.findUnique({ where: { id } });
    if (!album) {
      throw new NotFoundException('Álbum não encontrado');
    }
    return album;
  }

  async update(id: number, updateAlbumDto: UpdateAlbumDto) {
    await this.findOne(id);
    return await this.prismaService.album.update({ where: { id }, data: updateAlbumDto });
  }

  // Dia 4: remover Album deleta as Photos em cascata no banco (onDelete:
  // Cascade no schema - RN010), mas isso não fala com o storage. Por isso
  // buscamos as Photos ANTES de deletar, guardamos as URLs, deletamos o
  // Album (cascata no banco já limpa as Photos), e só então disparamos a
  // remoção dos arquivos físicos no storage em paralelo.
  async remove(id: number) {
    await this.findOne(id);

    const photos = await this.prismaService.photo.findMany({ where: { albumId: id } });

    const deletedAlbum = await this.prismaService.album.delete({ where: { id } });

    await Promise.all(
      photos.map((photo) =>
        this.storageService.deleteFile(photo.url).catch((error) => {
          // Mesma decisão do PhotosService.remove: falha ao limpar o
          // storage não deve quebrar a resposta da API, só logar.
          console.error(
            `Falha ao remover arquivo do storage para Photo ${photo.id} (Album ${id}):`,
            error,
          );
        }),
      ),
    );

    return deletedAlbum;
  }
}