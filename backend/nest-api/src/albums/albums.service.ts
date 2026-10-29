// src/albums/albums.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Prisma } from '../../generated/prisma/client';
import { generateSlug } from '../common/utils/slug.util';

const MAX_SLUG_ATTEMPTS = 5;
const MAX_SLUG_BASE = 140; // slug é VarChar(150); sobra espaço para "-NN"

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

@Injectable()
export class AlbumsService {
  private readonly logger = new Logger(AlbumsService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // RN003: se há vínculo, o Evento precisa existir (400 amigável em vez de P2003 genérico).
  private async assertEventExists(eventId?: number | null) {
    if (eventId === undefined || eventId === null) return;
    const event = await this.prismaService.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });
    if (!event) throw new BadRequestException('Evento informado não existe');
  }

  // Slug livre: base, base-2, base-3...
  private async nextFreeSlug(base: string): Promise<string> {
    const existing = await this.prismaService.album.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    const taken = new Set(existing.map((e) => e.slug));
    if (!taken.has(base)) return base;
    let n = 2;
    while (taken.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
  }

  async create(dto: CreateAlbumDto) {
    const { slug, ...rest } = dto;
    await this.assertEventExists(rest.eventId);

    // Slug explícito: conflito é erro do usuário (409)
    if (slug) {
      try {
        return await this.prismaService.album.create({ data: { ...rest, slug } });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ConflictException('Já existe um álbum com esse slug');
        }
        throw error;
      }
    }

    // Slug automático: sufixo + retry (o UNIQUE do banco é a defesa final contra corrida)
    const base =
      generateSlug(rest.title).slice(0, MAX_SLUG_BASE).replace(/-+$/, '') ||
      'album';
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const finalSlug = await this.nextFreeSlug(base);
      try {
        return await this.prismaService.album.create({
          data: { ...rest, slug: finalSlug },
        });
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
      }
    }
    throw new ConflictException(
      'Não foi possível gerar um slug único, tente novamente',
    );
  }

  // Lista com agregados numa única query (sem N+1 e sem baixar todas as fotos):
  // contagem de fotos, URL da capa e nome do evento.
  async findAll() {
    const albums = await this.prismaService.album.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        event: { select: { id: true, name: true } },
        _count: { select: { photos: true } },
        photos: { where: { isCover: true }, take: 1, select: { url: true } },
      },
    });

    return albums.map(({ photos, _count, event, ...album }) => ({
      ...album,
      eventName: event?.name ?? null,
      photoCount: _count.photos,
      coverUrl: photos[0]?.url ?? null,
    }));
  }

  async findOne(id: number) {
    const album = await this.prismaService.album.findUnique({ where: { id } });
    if (!album) throw new NotFoundException('Álbum não encontrado');
    return album;
  }

  async update(id: number, dto: UpdateAlbumDto) {
    await this.findOne(id);
    await this.assertEventExists(dto.eventId);
    return this.prismaService.album.update({ where: { id }, data: dto });
  }

  // UC029: a cascata Album -> Photos é atômica no banco (onDelete: Cascade).
  // O storage não participa dela: guardamos as URLs antes e limpamos depois.
  // Falha de storage NÃO quebra a resposta; vira log estruturado com a URL
  // para limpeza manual (débito: fila/rotina de órfãos, Bloco 5).
  async remove(id: number) {
    await this.findOne(id);

    const photos = await this.prismaService.photo.findMany({
      where: { albumId: id },
      select: { id: true, url: true },
    });

    const deletedAlbum = await this.prismaService.album.delete({ where: { id } });

    await Promise.all(
      photos.map((photo) =>
        this.storageService.deleteFile(photo.url).catch((error) => {
          this.logger.error(
            `ORPHAN_FILE album=${id} photo=${photo.id} url=${photo.url}`,
            error instanceof Error ? error.stack : String(error),
          );
        }),
      ),
    );

    return deletedAlbum;
  }
}