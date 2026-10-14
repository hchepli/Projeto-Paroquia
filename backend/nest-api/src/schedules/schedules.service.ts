import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleQueryDto } from './dto/schedule-query.dto';
import { Prisma } from '../../generated/prisma/client';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

interface ScopedUser {
  roleName: string;
  pastoralGroupId: number | null;
}

@Injectable()
export class SchedulesService {
  constructor(private readonly prismaService: PrismaService) { }

  // Pastorais vinculadas a uma Missa OU Evento (RN017)
  private async getLinkedPastoralGroupIds(
    massId?: number | null,
    eventId?: number | null,
  ): Promise<number[]> {
    const rows =
      massId != null
        ? await this.prismaService.massPastoralGroup.findMany({
          where: { massId },
          select: { pastoralGroupId: true },
        })
        : await this.prismaService.eventPastoralGroup.findMany({
          where: { eventId: eventId! },
          select: { pastoralGroupId: true },
        });
    return rows.map((r) => r.pastoralGroupId);
  }

  async create(createScheduleDto: CreateScheduleDto, user: ScopedUser) {
    const { massId, eventId, assignments = [], pastoralGroupId: manualPastoralGroupId } = createScheduleDto;

    const hasMass = massId !== undefined && massId !== null;
    const hasEvent = eventId !== undefined && eventId !== null;

    // RN007: Missa XOR Evento
    if (hasMass === hasEvent) {
      throw new BadRequestException(
        'A Escala deve estar vinculada a uma Missa OU a um Evento, nunca ambos nem nenhum (RN007).',
      );
    }

    // Duplicidade dentro do próprio request
    const seen = new Set<string>();
    for (const a of assignments) {
      const key = `${a.volunteerId}:${a.role}`;
      if (seen.has(key)) {
        throw new BadRequestException(
          `Atribuição duplicada no request: volunteerId=${a.volunteerId}, role="${a.role}".`,
        );
      }
      seen.add(key);
    }

    const isCoordinator = user.roleName === 'Coordenador de Pastoral';
    const finalPastoralGroupId = isCoordinator
      ? user.pastoralGroupId
      : (manualPastoralGroupId ?? null);

    // Pastoral agora é OBRIGATÓRIA: 1 escala por pastoral.
    if (finalPastoralGroupId === null || finalPastoralGroupId === undefined) {
      throw new BadRequestException(
        isCoordinator
          ? 'Seu usuário não está vinculado a nenhuma Pastoral.'
          : 'Informe a Pastoral da escala (pastoralGroupId).',
      );
    }

    // RN017: a pastoral precisa estar vinculada à Missa/Evento
    const linkedIds = await this.getLinkedPastoralGroupIds(massId, eventId);
    if (!linkedIds.includes(finalPastoralGroupId)) {
      const msg = 'A Pastoral não está vinculada a esta Missa/Evento (RN017).';
      throw isCoordinator ? new ForbiddenException(msg) : new BadRequestException(msg);
    }

    // Uma escala por (Missa/Evento + Pastoral)
    const alreadyExists = await this.prismaService.schedule.findFirst({
      where: {
        massId: massId ?? null,
        eventId: eventId ?? null,
        pastoralGroupId: finalPastoralGroupId,
      },
      select: { id: true },
    });
    if (alreadyExists) {
      throw new ConflictException('Esta Pastoral já possui escala para esta Missa/Evento.');
    }

    // Voluntários precisam ser da pastoral da escala
    if (assignments.length > 0) {
      const ids = [...new Set(assignments.map((a) => a.volunteerId))];
      const found = await this.prismaService.volunteer.findMany({
        where: { id: { in: ids } },
        select: { id: true, pastoralGroupId: true },
      });
      if (found.length !== ids.length) {
        throw new BadRequestException('Algum Voluntário informado não existe.');
      }
      if (found.some((v) => v.pastoralGroupId !== finalPastoralGroupId)) {
        throw new BadRequestException(
          'Todos os Voluntários da escala devem pertencer à Pastoral da escala.',
        );
      }
    }

    try {
      return await this.prismaService.$transaction(async (tx) => {
        const schedule = await tx.schedule.create({
          data: {
            massId: massId ?? null,
            eventId: eventId ?? null,
            pastoralGroupId: finalPastoralGroupId,
          },
        });

        if (assignments.length > 0) {
          await tx.scheduleAssignment.createMany({
            data: assignments.map((a) => ({
              scheduleId: schedule.id,
              volunteerId: a.volunteerId,
              role: a.role,
            })),
          });
        }

        return tx.schedule.findUniqueOrThrow({
          where: { id: schedule.id },
          include: { assignments: true },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Missa, Evento ou algum Voluntário informado nas atribuições não existe.',
          );
        }
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Atribuição duplicada (mesmo voluntário + função na mesma escala).',
          );
        }
      }
      throw error;
    }
  }

  async findAll(user: ScopedUser, query: ScheduleQueryDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, massId, eventId, volunteerId, pastoralGroupId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    // Escopo por pastoral (RN006/RN008):
    // - Coordenador de Pastoral: SEMPRE restrito à própria pastoral, ignora
    //   qualquer pastoralGroupId vindo da query.
    // - Admin Geral/Secretaria: sem restrição fixa, mas podem opcionalmente
    //   filtrar por uma pastoral específica via query (troca de visualização).
    const scopeWhere: Prisma.ScheduleWhereInput =
      user.roleName === 'Coordenador de Pastoral'
        ? { pastoralGroupId: user.pastoralGroupId }
        : pastoralGroupId
          ? { pastoralGroupId }
          : {};

    // Filtros adicionais do relatório (RF008/UC023)
    const filterWhere: Prisma.ScheduleWhereInput = {
      ...(massId && { massId }),
      ...(eventId && { eventId }),
      ...(volunteerId && {
        assignments: { some: { volunteerId } },
      }),
      ...(query.search && {
        OR: [
          { assignments: { some: { volunteer: { name: { contains: query.search, mode: 'insensitive' } } } } },
          { mass: { title: { contains: query.search, mode: 'insensitive' } } },
          { event: { name: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
      ...((startDate || endDate) && {
        OR: [
          { mass: { dateTime: { ...(startDate && { gte: new Date(startDate) }), ...(endDate && { lte: new Date(endDate) }) } } },
          { event: { startDate: { ...(startDate && { gte: new Date(startDate) }), ...(endDate && { lte: new Date(endDate) }) } } },
        ],
      }),
    };

    const where: Prisma.ScheduleWhereInput = {
      AND: [scopeWhere, filterWhere],
    };

    const [data, total] = await Promise.all([
      this.prismaService.schedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ mass: { dateTime: 'desc' } }, { event: { startDate: 'desc' } }],
        include: {
          mass: { select: { id: true, title: true, dateTime: true } },
          event: { select: { id: true, name: true, startDate: true } },
          pastoralGroup: { select: { id: true, name: true } },
          assignments: {
            include: {
              volunteer: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prismaService.schedule.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllForExport(user: ScopedUser, query: ScheduleQueryDto) {
    const { massId, eventId, volunteerId, pastoralGroupId, startDate, endDate } = query;

    // Escopo por pastoral (RN006/RN008) - idêntico ao findAll
    const scopeWhere: Prisma.ScheduleWhereInput =
      user.roleName === 'Coordenador de Pastoral'
        ? { pastoralGroupId: user.pastoralGroupId }
        : pastoralGroupId
          ? { pastoralGroupId }
          : {};

    // Filtros do relatório - idêntico ao findAll
    const filterWhere: Prisma.ScheduleWhereInput = {
      ...(massId && { massId }),
      ...(eventId && { eventId }),
      ...(volunteerId && {
        assignments: { some: { volunteerId } },
      }),
      ...((startDate || endDate) && {
        OR: [
          {
            mass: {
              dateTime: {
                ...(startDate && { gte: new Date(startDate) }),
                ...(endDate && { lte: new Date(endDate) }),
              },
            },
          },
          {
            event: {
              startDate: {
                ...(startDate && { gte: new Date(startDate) }),
                ...(endDate && { lte: new Date(endDate) }),
              },
            },
          },
        ],
      }),
    };

    const where: Prisma.ScheduleWhereInput = {
      AND: [scopeWhere, filterWhere],
    };

    // Sem skip/take - retorna o conjunto completo filtrado.
    // Includes necessários pra montar as colunas do relatório.
    return this.prismaService.schedule.findMany({
      where,
      include: {
        mass: { select: { title: true, dateTime: true } },
        event: { select: { name: true, startDate: true } },
        pastoralGroup: { select: { name: true } },
        assignments: {
          include: {
            volunteer: { select: { name: true } },
          },
        },
      },
      orderBy: [{ mass: { dateTime: 'asc' } }, { event: { startDate: 'asc' } }],
    });
  }

  async findOne(id: string, user: ScopedUser) {
    const schedule = await this.prismaService.schedule.findUnique({ where: { id } });

    if (!schedule) {
      throw new NotFoundException('Escala não encontrada');
    }

    if (
      user.roleName === 'Coordenador de Pastoral' &&
      schedule.pastoralGroupId !== user.pastoralGroupId
    ) {
      throw new ForbiddenException('Você não tem acesso a esta escala.');
    }

    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto, user: ScopedUser) {
    await this.findOne(id, user);

    // Vínculos (massId/eventId/pastoralGroupId) e atribuições NÃO podem ser
    // alterados por aqui: mexer neles burlaria RN006/RN007/RN017.
    // Hoje não sobra campo editável no Schedule; edição de atribuições
    // fica para uma tarefa própria.
    const { massId, eventId, pastoralGroupId, ...editable } = updateScheduleDto;
    void massId; void eventId; void pastoralGroupId;

    try {
      return await this.prismaService.schedule.update({ where: { id }, data: editable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Já existe uma escala com esse horário, data e função');
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Missa, Evento ou Pastoral informado(a) não existe.');
        }
      }
      throw error;
    }
  }

  // NOVO: cobertura por Missa/Evento (1 linha por Missa/Evento, com status por pastoral)
  async findCoverage(start: string, end: string, user: ScopedUser, pastoralGroupId?: number) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const isCoordinator = user.roleName === 'Coordenador de Pastoral';

    if (isCoordinator && !user.pastoralGroupId) return [];
    const scopedId = isCoordinator ? user.pastoralGroupId! : pastoralGroupId;

    const pgSelect = {
      where: scopedId ? { pastoralGroupId: scopedId } : undefined,
      select: { pastoralGroupId: true, pastoralGroup: { select: { name: true } } },
    };
    const linkFilter = scopedId ? { pastoralGroups: { some: { pastoralGroupId: scopedId } } } : {};

    const [masses, events] = await Promise.all([
      this.prismaService.mass.findMany({
        where: { dateTime: { gte: startDate, lte: endDate }, ...linkFilter },
        orderBy: { dateTime: 'asc' },
        select: {
          id: true,
          title: true,
          dateTime: true,
          pastoralGroups: pgSelect,
          schedules: { select: { pastoralGroupId: true } },
        },
      }),
      this.prismaService.event.findMany({
        where: { startDate: { gte: startDate, lte: endDate }, ...linkFilter },
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          name: true,
          startDate: true,
          pastoralGroups: pgSelect,
          schedules: { select: { pastoralGroupId: true } },
        },
      }),
    ]);

    const build = (
      sourceType: 'MASS' | 'EVENT',
      sourceId: number,
      title: string,
      date: Date,
      links: { pastoralGroupId: number; pastoralGroup: { name: string } }[],
      schedules: { pastoralGroupId: number | null }[],
    ) => {
      const done = new Set(schedules.map((s) => s.pastoralGroupId));
      const pastorals = links.map((l) => ({
        id: l.pastoralGroupId,
        name: l.pastoralGroup.name,
        scheduled: done.has(l.pastoralGroupId),
      }));
      const status =
        pastorals.length === 0
          ? 'NO_PASTORAL'
          : pastorals.every((p) => p.scheduled)
            ? 'COMPLETE'
            : 'INCOMPLETE';
      return { sourceType, sourceId, title, date, status, pastorals };
    };

    return [
      ...masses.map((m) => build('MASS', m.id, m.title, m.dateTime, m.pastoralGroups, m.schedules)),
      ...events.map((e) => build('EVENT', e.id, e.name, e.startDate, e.pastoralGroups, e.schedules)),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // LEGADO: manter até o front migrar para /schedules/coverage
  async findPending(
    start: string,
    end: string,
    user: ScopedUser,
    pastoralGroupId?: number,
  ) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const isCoordinator = user.roleName === 'Coordenador de Pastoral';

    // Escopo (RN006/RN008 + regra do PastoralSwitcher):
    // - Coordenador: SEMPRE a própria pastoral, ignora qualquer filtro vindo da query.
    // - Admin/Secretaria: sem filtro = pendente geral (todas as pastorais);
    //   com pastoralGroupId na query (switcher numa pastoral específica) = só aquela.
    const scopedPastoralGroupId = isCoordinator ? user.pastoralGroupId! : pastoralGroupId;

    const [masses, events] = await Promise.all([
      this.prismaService.mass.findMany({
        where: {
          dateTime: { gte: startDate, lte: endDate },
          pastoralGroups: scopedPastoralGroupId
            ? { some: { pastoralGroupId: scopedPastoralGroupId } }
            : { some: {} },
        },
        select: {
          id: true,
          title: true,
          dateTime: true,
          pastoralGroups: {
            where: scopedPastoralGroupId ? { pastoralGroupId: scopedPastoralGroupId } : undefined,
            select: { pastoralGroupId: true, pastoralGroup: { select: { name: true } } },
          },
        },
      }),
      this.prismaService.event.findMany({
        where: {
          startDate: { gte: startDate, lte: endDate },
          pastoralGroups: scopedPastoralGroupId
            ? { some: { pastoralGroupId: scopedPastoralGroupId } }
            : { some: {} },
        },
        select: {
          id: true,
          name: true,
          startDate: true,
          pastoralGroups: {
            where: scopedPastoralGroupId ? { pastoralGroupId: scopedPastoralGroupId } : undefined,
            select: { pastoralGroupId: true, pastoralGroup: { select: { name: true } } },
          },
        },
      }),
    ]);

    // Checagem de "já escalado" continua SEM escopo — precisa saber se existe
    // Schedule pra aquele par, mesmo que seja de outra pastoral.
    const existingSchedules = await this.prismaService.schedule.findMany({
      where: {
        OR: [
          { mass: { dateTime: { gte: startDate, lte: endDate } } },
          { event: { startDate: { gte: startDate, lte: endDate } } },
        ],
      },
      select: { massId: true, eventId: true, pastoralGroupId: true },
    });

    const scheduledMassPairs = new Set(
      existingSchedules.filter((s) => s.massId !== null).map((s) => `${s.massId}:${s.pastoralGroupId}`),
    );
    const scheduledEventPairs = new Set(
      existingSchedules.filter((s) => s.eventId !== null).map((s) => `${s.eventId}:${s.pastoralGroupId}`),
    );

    const pendingFromMasses = masses.flatMap((mass) =>
      mass.pastoralGroups
        .filter((pg) => !scheduledMassPairs.has(`${mass.id}:${pg.pastoralGroupId}`))
        .map((pg) => ({
          sourceType: 'MASS' as const,
          sourceId: mass.id,
          sourceTitle: mass.title,
          sourceDate: mass.dateTime,
          pastoralGroupId: pg.pastoralGroupId,
          pastoralGroupName: pg.pastoralGroup.name,
        })),
    );

    const pendingFromEvents = events.flatMap((event) =>
      event.pastoralGroups
        .filter((pg) => !scheduledEventPairs.has(`${event.id}:${pg.pastoralGroupId}`))
        .map((pg) => ({
          sourceType: 'EVENT' as const,
          sourceId: event.id,
          sourceTitle: event.name,
          sourceDate: event.startDate,
          pastoralGroupId: pg.pastoralGroupId,
          pastoralGroupName: pg.pastoralGroup.name,
        })),
    );

    return [...pendingFromMasses, ...pendingFromEvents].sort(
      (a, b) => a.sourceDate.getTime() - b.sourceDate.getTime(),
    );
  }

  async remove(id: string, user: ScopedUser) {
    await this.findOne(id, user);
    return this.prismaService.schedule.delete({ where: { id } });
  }
}