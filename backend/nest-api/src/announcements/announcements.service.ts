import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AdminAnnouncementQueryDto } from './dto/admin-announcement-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Announcement, Prisma } from '../../generated/prisma/client';
import { generateSlug } from '../common/utils/slug.util';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

// Público: nunca expõe authorId; lista não traz o content inteiro.
const publicListSelect = {
  id: true,
  title: true,
  slug: true,
  imageUrl: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
} satisfies Prisma.AnnouncementSelect;

const publicDetailSelect = {
  ...publicListSelect,
  content: true,
} satisfies Prisma.AnnouncementSelect;

export type PublicAnnouncementListItem = Prisma.AnnouncementGetPayload<{
  select: typeof publicListSelect;
}>;

const ALLOWED_SORT_FIELDS = ['createdAt', 'title'] as const;
const MAX_SLUG_ATTEMPTS = 5;

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prismaService: PrismaService) {}

  // ---------- helpers ----------

  private buildOrderBy(query: PaginationQueryDto) {
    const sortBy = ALLOWED_SORT_FIELDS.includes(query.sortBy as any)
      ? (query.sortBy as string)
      : 'createdAt';
    return { [sortBy]: query.order ?? 'desc' };
  }

  private buildWhere(
    search?: string,
    status?: 'DRAFT' | 'PUBLISHED',
  ): Prisma.AnnouncementWhereInput {
    return {
      ...(status && { status }),
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
    };
  }

  // RN: categoria de comunicado precisa ser do tipo ANNOUNCEMENT (não só no front)
  private async assertAnnouncementCategory(categoryId?: number | null) {
    if (categoryId === undefined || categoryId === null) return;
    const category = await this.prismaService.category.findUnique({
      where: { id: categoryId },
    });
    if (!category || category.type !== 'ANNOUNCEMENT') {
      throw new BadRequestException(
        'Categoria inválida para comunicados',
      );
    }
  }

  // Gera slug livre: base, base-2, base-3...
  private async nextFreeSlug(base: string): Promise<string> {
    const existing = await this.prismaService.announcement.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    const taken = new Set(existing.map((e) => e.slug));
    if (!taken.has(base)) return base;
    let n = 2;
    while (taken.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
  }

  // ---------- escrita ----------

  async create(dto: CreateAnnouncementDto, authorId: string) {
    const { slug, ...rest } = dto;
    await this.assertAnnouncementCategory(rest.categoryId);

    // Slug explícito: conflito é erro do usuário (409)
    if (slug) {
      try {
        return await this.prismaService.announcement.create({
          data: { ...rest, slug, authorId },
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ConflictException('Já existe um comunicado com esse slug');
        }
        throw error;
      }
    }

    // Slug automático: sufixo -2, -3... e retry se outra request pegou o mesmo
    // slug entre o SELECT e o INSERT (o UNIQUE do banco é a defesa final).
    const base = generateSlug(rest.title) || 'comunicado';
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const finalSlug = await this.nextFreeSlug(base);
      try {
        return await this.prismaService.announcement.create({
          data: { ...rest, slug: finalSlug, authorId },
        });
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
      }
    }
    throw new ConflictException(
      'Não foi possível gerar um slug único, tente novamente',
    );
  }

  async update(id: number, dto: UpdateAnnouncementDto) {
    await this.findOneAdmin(id);
    await this.assertAnnouncementCategory(dto.categoryId);
    try {
      // Slug não muda ao editar o título (URLs públicas estáveis, RNF014)
      return await this.prismaService.announcement.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Já existe um comunicado com esse slug');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOneAdmin(id);
    return await this.prismaService.announcement.delete({ where: { id } });
  }

  // ---------- leitura pública (só PUBLISHED) ----------

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<PublicAnnouncementListItem>> {
    const { page = 1, limit = 10, search } = query;
    const where = this.buildWhere(search, 'PUBLISHED');

    const [data, total] = await Promise.all([
      this.prismaService.announcement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: this.buildOrderBy(query),
        select: publicListSelect,
      }),
      this.prismaService.announcement.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // UC026 / RNF014: detalhe por slug. Rascunho = 404 (não vaza).
  async findBySlug(slug: string) {
    const announcement = await this.prismaService.announcement.findFirst({
      where: { slug, status: 'PUBLISHED' },
      select: publicDetailSelect,
    });
    if (!announcement) throw new NotFoundException('Comunicado não encontrado');
    return announcement;
  }

  async findOne(id: number) {
    const announcement = await this.prismaService.announcement.findFirst({
      where: { id, status: 'PUBLISHED' },
      select: publicDetailSelect,
    });
    if (!announcement) throw new NotFoundException('Comunicado não encontrado');
    return announcement;
  }

  // ---------- leitura admin ----------

  async findAllAdmin(
    query: AdminAnnouncementQueryDto,
  ): Promise<PaginatedResult<Announcement>> {
    const { page = 1, limit = 10, search, status } = query;
    const where = this.buildWhere(search, status);

    const [data, total] = await Promise.all([
      this.prismaService.announcement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: this.buildOrderBy(query),
      }),
      this.prismaService.announcement.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Substitui 4 requests do front (inclusive o limit:100 só pra contar o mês)
  async getStats() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [total, published, draft, thisMonth] = await Promise.all([
      this.prismaService.announcement.count(),
      this.prismaService.announcement.count({ where: { status: 'PUBLISHED' } }),
      this.prismaService.announcement.count({ where: { status: 'DRAFT' } }),
      this.prismaService.announcement.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
    ]);

    return { total, published, draft, thisMonth };
  }

  async findOneAdmin(id: number) {
    const announcement = await this.prismaService.announcement.findUnique({
      where: { id },
    });
    if (!announcement) throw new NotFoundException('Comunicado não encontrado');
    return announcement;
  }
}