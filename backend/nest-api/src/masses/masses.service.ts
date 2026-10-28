// src/masses/masses.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { CreateMassDto } from './dto/create-mass.dto';
import { UpdateMassDto } from './dto/update-mass.dto';
import { LinkPastoralGroupsDto } from './dto/link-pastoral-groups.dto';
import { MassQueryDto } from './dto/mass-query.dto';
import { DateRangeQueryDto } from '../common/dto/date-range-query.dto';
import { buildDateRangeFilter } from '../common/utils/date-range.util';

// Campos expostos (a leitura é pública): sem createdAt, sem generatedFromTemplateId,
// e Pastoral só com id/name (sem contato/defaultRole).
const MASS_LIST_SELECT = {
  id: true,
  title: true,
  dateTime: true,
  type: true,
  location: true,
  notes: true,
} satisfies Prisma.MassSelect;

const MASS_DETAIL_SELECT = {
  ...MASS_LIST_SELECT,
  pastoralGroups: {
    select: { pastoralGroup: { select: { id: true, name: true } } },
  },
} satisfies Prisma.MassSelect;

@Injectable()
export class MassesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateMassDto) {
    const { pastoralGroupIds, ...data } = dto;
    return this.prismaService.$transaction(async (tx) => {
      const mass = await tx.mass.create({ data });
      if (pastoralGroupIds?.length) {
        await this.syncPastoralGroups(tx, mass.id, pastoralGroupIds);
      }
      return tx.mass.findUniqueOrThrow({
        where: { id: mass.id },
        select: MASS_DETAIL_SELECT,
      });
    });
  }

  async findAll(query: MassQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      order = 'asc',
      startDate,
      endDate,
    } = query;
    const dateRange = buildDateRangeFilter(startDate, endDate);

    const where: Prisma.MassWhereInput = {
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
      ...(dateRange && { dateTime: dateRange }),
    };

    const allowedSortFields = ['dateTime', 'title'];
    const orderBy: Prisma.MassOrderByWithRelationInput =
      allowedSortFields.includes(sortBy ?? '')
        ? { [sortBy as string]: order }
        : { dateTime: order };

    const [data, total] = await Promise.all([
      this.prismaService.mass.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: MASS_LIST_SELECT,
      }),
      this.prismaService.mass.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Card "Missas sem Pastoral" (Painel). Não paginado de propósito (contador/lista curta).
  async findWithoutPastoral(query: DateRangeQueryDto) {
    const dateRange = buildDateRangeFilter(query.startDate, query.endDate);
    const data = await this.prismaService.mass.findMany({
      where: {
        pastoralGroups: { none: {} },
        ...(dateRange && { dateTime: dateRange }),
      },
      orderBy: { dateTime: 'asc' },
      select: MASS_LIST_SELECT,
      take: 500,
    });
    return { data, total: data.length };
  }

  async findOne(id: number) {
    const mass = await this.prismaService.mass.findUnique({
      where: { id },
      select: MASS_DETAIL_SELECT,
    });
    if (!mass) throw new NotFoundException('Missa não encontrada');
    return mass;
  }

  async update(id: number, dto: UpdateMassDto) {
    const { pastoralGroupIds, ...data } = dto;
    return this.prismaService.$transaction(async (tx) => {
      await this.lockMass(tx, id);
      if (pastoralGroupIds !== undefined) {
        await this.syncPastoralGroups(tx, id, pastoralGroupIds);
      }
      // generatedFromTemplateId/templateOccurrenceAt não estão no DTO: editar dateTime é livre.
      await tx.mass.update({ where: { id }, data });
      return tx.mass.findUniqueOrThrow({
        where: { id },
        select: MASS_DETAIL_SELECT,
      });
    });
  }

  /**
   * RN016: se houver Escalas, exige confirm=true; a cascata (Missa -> Escalas ->
   * Atribuições) é do banco (onDelete: Cascade) dentro da MESMA transação.
   * O FOR UPDATE serializa com INSERT de Escala (FK pega KEY SHARE na Missa).
   * Se a Missa veio de recorrência, grava o skip para o ensureGenerated não recriá-la.
   */
  async remove(id: number, confirm = false) {
    return this.prismaService.$transaction(async (tx) => {
      await this.lockMass(tx, id);

      const mass = await tx.mass.findUnique({
        where: { id },
        include: {
          schedules: {
            select: {
              id: true,
              pastoralGroup: { select: { id: true, name: true } },
              _count: { select: { assignments: true } },
            },
          },
          events: { select: { id: true, name: true } },
        },
      });
      if (!mass) throw new NotFoundException('Missa não encontrada');

      if (mass.schedules.length > 0 && !confirm) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          code: 'MASS_HAS_SCHEDULES',
          message: `Esta missa possui ${mass.schedules.length} escala(s). Excluí-la apagará também as escalas e suas atribuições. Confirme para prosseguir.`,
          schedules: mass.schedules.map((s) => ({
            id: s.id,
            pastoralGroup: s.pastoralGroup,
            assignmentsCount: s._count.assignments,
          })),
          linkedEvents: mass.events, // ficarão sem missa correlacionada (RN002), sem bloquear
        });
      }

      if (mass.generatedFromTemplateId !== null && mass.templateOccurrenceAt) {
        await tx.massTemplateSkip.createMany({
          data: [
            {
              templateId: mass.generatedFromTemplateId,
              occurrenceAt: mass.templateOccurrenceAt,
            },
          ],
          skipDuplicates: true,
        });
      }

      await tx.mass.delete({ where: { id } });

      return {
        id: mass.id,
        title: mass.title,
        dateTime: mass.dateTime,
        removedSchedules: mass.schedules.length,
        unlinkedEvents: mass.events,
      };
    });
  }

  // Mantido por compatibilidade (o front atual ainda chama). PATCH /masses/:id já sincroniza.
  async linkPastoralGroups(id: number, dto: LinkPastoralGroupsDto) {
    return this.prismaService.$transaction(async (tx) => {
      await this.lockMass(tx, id);
      await this.syncPastoralGroups(tx, id, dto.pastoralGroupIds);
      return tx.massPastoralGroup.findMany({
        where: { massId: id },
        select: {
          massId: true,
          pastoralGroupId: true,
          pastoralGroup: { select: { id: true, name: true } },
        },
      });
    });
  }

  private async lockMass(
    tx: Prisma.TransactionClient,
    id: number,
  ): Promise<void> {
    const rows = await tx.$queryRaw<
      { id: number }[]
    >`SELECT id FROM "missas" WHERE id = ${id} FOR UPDATE`;
    if (rows.length === 0) throw new NotFoundException('Missa não encontrada');
  }

  /** Torna o conjunto de Pastorais igual a `ids`, sem tocar nas que já estão (RN017). */
  private async syncPastoralGroups(
    tx: Prisma.TransactionClient,
    massId: number,
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

    const current = await tx.massPastoralGroup.findMany({
      where: { massId },
      select: { pastoralGroupId: true },
    });
    const currentIds = current.map((c) => c.pastoralGroupId);
    const toRemove = currentIds.filter((pid) => !unique.includes(pid));
    const toAdd = unique.filter((pid) => !currentIds.includes(pid));

    if (toRemove.length > 0) {
      const blocking = await tx.schedule.findMany({
        where: { massId, pastoralGroupId: { in: toRemove } },
        select: { pastoralGroup: { select: { name: true } } },
      });
      if (blocking.length > 0) {
        const names = blocking
          .map((b) => b.pastoralGroup?.name ?? '?')
          .join(', ');
        throw new ConflictException(
          `Não é possível desvincular: ${names} já possui(em) escala nesta missa. Remova a escala antes.`,
        );
      }
      await tx.massPastoralGroup.deleteMany({
        where: { massId, pastoralGroupId: { in: toRemove } },
      });
    }

    if (toAdd.length > 0) {
      await tx.massPastoralGroup.createMany({
        data: toAdd.map((pastoralGroupId) => ({ massId, pastoralGroupId })),
        skipDuplicates: true,
      });
    }
  }
}
