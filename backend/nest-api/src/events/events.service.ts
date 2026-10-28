// src/events/events.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { LinkPastoralGroupsDto } from './dto/link-pastoral-groups.dto';
import {
  FindAdminEventsQueryDto,
  FindEventsQueryDto,
} from './dto/find-events-query.dto';
import { generateSlug } from '../common/utils/slug.util';
import { assertEndNotBeforeStart } from '../common/utils/date-order.util';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

// Campos expostos na leitura pública: sem status, createdAt/updatedAt, massId/categoryId crus
// e Pastoral só com id/name (sem contato/defaultRole).
const EVENT_PUBLIC_LIST_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  startDate: true,
  endDate: true,
  location: true,
  category: { select: { id: true, name: true } },
  pastoralGroups: {
    select: { pastoralGroup: { select: { id: true, name: true } } },
  },
} satisfies Prisma.EventSelect;

const EVENT_PUBLIC_DETAIL_SELECT = {
  ...EVENT_PUBLIC_LIST_SELECT,
  mass: { select: { id: true, title: true, dateTime: true } },
  albums: { select: { id: true, title: true, slug: true } },
} satisfies Prisma.EventSelect;

const EVENT_ADMIN_SELECT = {
  ...EVENT_PUBLIC_DETAIL_SELECT,
  status: true,
  massId: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { attendanceConfirmations: true } },
} satisfies Prisma.EventSelect;

const MAX_SLUG_ATTEMPTS = 5;
const SLUG_BASE_MAX = 170; // sobra espaço para o sufixo "-N" dentro dos 180 do banco

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

@Injectable()
export class EventsService {
  constructor(private readonly prismaService: PrismaService) {}

  // ---------------------------------------------------------------- escrita

  async create(dto: CreateEventDto) {
    const { pastoralGroupIds, slug, startDate, endDate, ...rest } = dto;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    assertEndNotBeforeStart(start, end);

    const base = this.slugBase(rest.name);

    // Slug automático: a defesa real contra corrida é o UNIQUE do banco; se dois admins
    // pegarem o mesmo candidato, o perdedor recalcula e tenta de novo (nova transação,
    // pois no Postgres um erro aborta a transação inteira).
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const finalSlug = slug ?? (await this.nextFreeSlug(base));
      try {
        return await this.prismaService.$transaction(async (tx) => {
          await this.assertReferences(tx, rest.massId, rest.categoryId);
          const event = await tx.event.create({
            data: { ...rest, slug: finalSlug, startDate: start, endDate: end },
          });
          if (pastoralGroupIds?.length) {
            await this.syncPastoralGroups(tx, event.id, pastoralGroupIds);
          }
          return tx.event.findUniqueOrThrow({
            where: { id: event.id },
            select: EVENT_ADMIN_SELECT,
          });
        });
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        if (slug !== undefined)
          throw new ConflictException('Já existe um evento com este slug.');
        // slug automático: tenta de novo com um candidato recalculado
      }
    }
    throw new ConflictException(
      'Não foi possível gerar um slug único. Tente novamente.',
    );
  }

  async update(id: number, dto: UpdateEventDto) {
    const { pastoralGroupIds, slug, startDate, endDate, ...rest } = dto;

    try {
      return await this.prismaService.$transaction(async (tx) => {
        await this.lockEvent(tx, id);

        // endDate >= startDate considerando o que já está salvo (PATCH parcial)
        const current = await tx.event.findUniqueOrThrow({
          where: { id },
          select: { startDate: true, endDate: true },
        });
        const finalStart = startDate ? new Date(startDate) : current.startDate;
        const finalEnd =
          endDate === undefined
            ? current.endDate
            : endDate === null
              ? null
              : new Date(endDate);
        assertEndNotBeforeStart(finalStart, finalEnd);

        await this.assertReferences(tx, rest.massId, rest.categoryId);

        if (pastoralGroupIds !== undefined) {
          await this.syncPastoralGroups(tx, id, pastoralGroupIds);
        }

        // O slug NÃO é regenerado quando o nome muda (links públicos/SEO estáveis).
        await tx.event.update({
          where: { id },
          data: {
            ...rest,
            ...(slug !== undefined && { slug }),
            ...(startDate && { startDate: finalStart }),
            ...(endDate !== undefined && { endDate: finalEnd }),
          },
        });

        return tx.event.findUniqueOrThrow({
          where: { id },
          select: EVENT_ADMIN_SELECT,
        });
      });
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictException('Já existe um evento com este slug.');
      throw error;
    }
  }

  /**
   * RN016: se houver Escalas, exige confirm=true; a cascata (Evento -> Escalas -> Atribuições
   * e Evento -> Confirmações) é do banco, na MESMA transação. FOR UPDATE serializa com o
   * INSERT de Escala. Álbuns ficam avulsos (SET NULL, UC017 4b) e não bloqueiam.
   */
  async remove(id: number, confirm = false) {
    return this.prismaService.$transaction(async (tx) => {
      await this.lockEvent(tx, id);

      const event = await tx.event.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          schedules: {
            select: {
              id: true,
              pastoralGroup: { select: { id: true, name: true } },
              _count: { select: { assignments: true } },
            },
          },
          albums: { select: { id: true, title: true } },
          _count: { select: { attendanceConfirmations: true } },
        },
      });
      if (!event) throw new NotFoundException('Evento não encontrado');

      if (event.schedules.length > 0 && !confirm) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          code: 'EVENT_HAS_SCHEDULES',
          message: `Este evento possui ${event.schedules.length} escala(s). Excluí-lo apagará também as escalas e suas atribuições. Confirme para prosseguir.`,
          schedules: event.schedules.map((s) => ({
            id: s.id,
            pastoralGroup: s.pastoralGroup,
            assignmentsCount: s._count.assignments,
          })),
          linkedAlbums: event.albums, // ficarão avulsos (RN003), sem bloquear
        });
      }

      await tx.event.delete({ where: { id } });

      return {
        id: event.id,
        name: event.name,
        removedSchedules: event.schedules.length,
        removedAttendanceConfirmations: event._count.attendanceConfirmations,
        unlinkedAlbums: event.albums,
      };
    });
  }

  // Mantido por compatibilidade com o front atual. PATCH /events/:id já sincroniza.
  async linkPastoralGroups(id: number, dto: LinkPastoralGroupsDto) {
    return this.prismaService.$transaction(async (tx) => {
      await this.lockEvent(tx, id);
      await this.syncPastoralGroups(tx, id, dto.pastoralGroupIds);
      return tx.eventPastoralGroup.findMany({
        where: { eventId: id },
        select: {
          eventId: true,
          pastoralGroupId: true,
          pastoralGroup: { select: { id: true, name: true } },
        },
      });
    });
  }

  // ---------------------------------------------------------------- leitura

  /** Público: só ACTIVE, sem dados internos. */
  async findAllPublic(
    query: FindEventsQueryDto,
  ): Promise<PaginatedResult<unknown>> {
    const { page = 1, limit = 10 } = query;
    const where = this.buildWhere(query, 'ACTIVE');
    const [data, total] = await Promise.all([
      this.prismaService.event.findMany({
        where,
        orderBy: this.buildOrderBy(query),
        skip: (page - 1) * limit,
        take: limit,
        select: EVENT_PUBLIC_LIST_SELECT,
      }),
      this.prismaService.event.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** Admin: todos os status; contagem de confirmações só para quem pode ver (UC036). */
  async findAllAdmin(
    query: FindAdminEventsQueryDto,
    canSeeAttendance: boolean,
  ): Promise<PaginatedResult<unknown>> {
    const { page = 1, limit = 10 } = query;
    const where = this.buildWhere(query, query.status);
    const [rows, total] = await Promise.all([
      this.prismaService.event.findMany({
        where,
        orderBy: this.buildOrderBy(query),
        skip: (page - 1) * limit,
        take: limit,
        select: EVENT_ADMIN_SELECT,
      }),
      this.prismaService.event.count({ where }),
    ]);
    return {
      data: rows.map((r) => this.hideAttendance(r, canSeeAttendance)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOnePublic(id: number) {
    const event = await this.prismaService.event.findFirst({
      where: { id, status: 'ACTIVE' },
      select: EVENT_PUBLIC_DETAIL_SELECT,
    });
    if (!event) throw new NotFoundException('Evento não encontrado');
    return event;
  }

  async findBySlug(slug: string) {
    const event = await this.prismaService.event.findFirst({
      where: { slug, status: 'ACTIVE' },
      select: EVENT_PUBLIC_DETAIL_SELECT,
    });
    if (!event) throw new NotFoundException('Evento não encontrado');
    return event;
  }

  async findOneAdmin(id: number, canSeeAttendance: boolean) {
    const event = await this.prismaService.event.findUnique({
      where: { id },
      select: EVENT_ADMIN_SELECT,
    });
    if (!event) throw new NotFoundException('Evento não encontrado');
    return this.hideAttendance(event, canSeeAttendance);
  }

  // ---------------------------------------------------------------- helpers

  private buildWhere(
    query: FindEventsQueryDto,
    status?: 'ACTIVE' | 'CANCELLED',
  ): Prisma.EventWhereInput {
    const now = new Date();
    const and: Prisma.EventWhereInput[] = [];

    if (status) and.push({ status });
    if (query.search)
      and.push({ name: { contains: query.search, mode: 'insensitive' } });
    if (query.categoryId) and.push({ categoryId: query.categoryId });

    // "terminou" = (endDate ?? startDate) < agora
    if (query.period === 'upcoming') {
      and.push({
        OR: [
          { endDate: { gte: now } },
          { endDate: null, startDate: { gte: now } },
        ],
      });
    } else if (query.period === 'past') {
      and.push({
        OR: [
          { endDate: { lt: now } },
          { endDate: null, startDate: { lt: now } },
        ],
      });
    }

    return and.length > 0 ? { AND: and } : {};
  }

  private buildOrderBy(
    query: FindEventsQueryDto,
  ): Prisma.EventOrderByWithRelationInput {
    if (query.period === 'upcoming') return { startDate: 'asc' };
    if (query.period === 'past') return { startDate: 'desc' };
    const allowed = ['startDate', 'name'];
    const field = allowed.includes(query.sortBy ?? '')
      ? (query.sortBy as string)
      : 'startDate';
    return { [field]: query.order ?? 'desc' };
  }

  private hideAttendance<T extends { _count: unknown }>(
    row: T,
    canSee: boolean,
  ): Omit<T, '_count'> | T {
    if (canSee) return row;
    const { _count, ...rest } = row;
    void _count;
    return rest;
  }

  private slugBase(name: string): string {
    return (
      generateSlug(name).slice(0, SLUG_BASE_MAX).replace(/-+$/, '') || 'evento'
    );
  }

  private async nextFreeSlug(base: string): Promise<string> {
    const rows = await this.prismaService.event.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    const taken = new Set(rows.map((r) => r.slug));
    if (!taken.has(base)) return base;
    for (let n = 2; ; n++) {
      const candidate = `${base}-${n}`;
      if (!taken.has(candidate)) return candidate;
    }
  }

  /** Missa existente (RN002) e Categoria do tipo EVENT. null/undefined = nada a validar. */
  private async assertReferences(
    tx: Prisma.TransactionClient,
    massId: number | null | undefined,
    categoryId: number | null | undefined,
  ) {
    if (massId != null) {
      const mass = await tx.mass.findUnique({
        where: { id: massId },
        select: { id: true },
      });
      if (!mass) throw new BadRequestException('A Missa informada não existe.');
    }
    if (categoryId != null) {
      const category = await tx.category.findUnique({
        where: { id: categoryId },
        select: { type: true },
      });
      if (!category)
        throw new BadRequestException('A Categoria informada não existe.');
      if (category.type !== 'EVENT') {
        throw new BadRequestException(
          'A Categoria informada não é uma categoria de eventos.',
        );
      }
    }
  }

  private async lockEvent(
    tx: Prisma.TransactionClient,
    id: number,
  ): Promise<void> {
    const rows = await tx.$queryRaw<
      { id: number }[]
    >`SELECT id FROM "eventos" WHERE id = ${id} FOR UPDATE`;
    if (rows.length === 0) throw new NotFoundException('Evento não encontrado');
  }

  /** Torna o conjunto de Pastorais igual a `ids`, sem tocar nas que já estão (RN017). */
  private async syncPastoralGroups(
    tx: Prisma.TransactionClient,
    eventId: number,
    ids: number[],
  ) {
    const unique = [...new Set(ids)];

    const found = await tx.pastoralGroup.findMany({
      where: { id: { in: unique } },
      select: { id: true },
    });
    if (found.length !== unique.length) {
      throw new BadRequestException(
        'Uma ou mais Pastorais informadas não existem.',
      );
    }

    const current = await tx.eventPastoralGroup.findMany({
      where: { eventId },
      select: { pastoralGroupId: true },
    });
    const currentIds = current.map((c) => c.pastoralGroupId);
    const toRemove = currentIds.filter((pid) => !unique.includes(pid));
    const toAdd = unique.filter((pid) => !currentIds.includes(pid));

    if (toRemove.length > 0) {
      const blocking = await tx.schedule.findMany({
        where: { eventId, pastoralGroupId: { in: toRemove } },
        select: { pastoralGroup: { select: { name: true } } },
      });
      if (blocking.length > 0) {
        const names = blocking
          .map((b) => b.pastoralGroup?.name ?? '?')
          .join(', ');
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          code: 'EVENT_PASTORAL_HAS_SCHEDULE',
          message: `Não é possível desvincular: ${names} já possui(em) escala neste evento. Remova a escala antes.`,
        });
      }
      await tx.eventPastoralGroup.deleteMany({
        where: { eventId, pastoralGroupId: { in: toRemove } },
      });
    }

    if (toAdd.length > 0) {
      await tx.eventPastoralGroup.createMany({
        data: toAdd.map((pastoralGroupId) => ({ eventId, pastoralGroupId })),
        skipDuplicates: true,
      });
    }
  }
}
