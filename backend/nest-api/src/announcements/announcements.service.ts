import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AdminAnnouncementQueryDto } from './dto/admin-announcement-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Announcement, Prisma } from '../../generated/prisma/client';
import { generateSlug } from '../common/utils/slug.util';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createAnnouncementDto: CreateAnnouncementDto, authorId: string) {
    const { slug, ...rest } = createAnnouncementDto;
    const finalSlug = slug ?? generateSlug(rest.title);

    try {
      return await this.prismaService.announcement.create({
        data: { ...rest, slug: finalSlug, authorId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um anúncio com esse nome');
      }
      throw error;
    }
  }

  // Uso público (site institucional) - só comunicados publicados
  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Announcement>> {
    const { page = 1, limit = 10, search, sortBy, order = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AnnouncementWhereInput = {
      status: 'PUBLISHED',
      ...(search && {
        title: { contains: search, mode: 'insensitive' },
      }),
    };

    const allowedSortFields = ['createdAt', 'title'] as const;
    const finalSortBy = allowedSortFields.includes(sortBy as any) ? sortBy : 'createdAt';
    const orderBy = { [finalSortBy as string]: order };

    const [data, total] = await Promise.all([
      this.prismaService.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prismaService.announcement.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Uso administrativo - todos os status por padrão (ou filtrado via ?status=),
  // paginado, com busca e ordenação — mesmo formato do findAll público.
  async findAllAdmin(query: AdminAnnouncementQueryDto): Promise<PaginatedResult<Announcement>> {
    const { page = 1, limit = 10, search, sortBy, order = 'desc', status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AnnouncementWhereInput = {
      ...(status && { status }),
      ...(search && {
        title: { contains: search, mode: 'insensitive' },
      }),
    };

    const allowedSortFields = ['createdAt', 'title'] as const;
    const finalSortBy = allowedSortFields.includes(sortBy as any) ? sortBy : 'createdAt';
    const orderBy = { [finalSortBy as string]: order };

    const [data, total] = await Promise.all([
      this.prismaService.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prismaService.announcement.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Uso público - só retorna se estiver publicado (senão 404, não vaza rascunho por id)
  async findOne(id: number) {
    const announcement = await this.prismaService.announcement.findUnique({ where: { id } });
    if (!announcement || announcement.status !== 'PUBLISHED') {
      throw new NotFoundException('Anúncio não encontrado');
    }
    return announcement;
  }

  // Uso administrativo - encontra independente do status
  async findOneAdmin(id: number) {
    const announcement = await this.prismaService.announcement.findUnique({ where: { id } });
    if (!announcement) {
      throw new NotFoundException('Anúncio não encontrado');
    }
    return announcement;
  }

  async update(id: number, updateAnnouncementDto: UpdateAnnouncementDto) {
    await this.findOneAdmin(id);
    try {
      return await this.prismaService.announcement.update({ where: { id }, data: updateAnnouncementDto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um anúncio com esse nome');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOneAdmin(id);
    return await this.prismaService.announcement.delete({ where: { id } });
  }
}
