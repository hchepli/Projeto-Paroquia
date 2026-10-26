import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { buildDateRangeFilter } from '../common/utils/date-range.util';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { ScheduleQueryDto } from './dto/schedule-query.dto';
import { CoverageQueryDto } from './dto/coverage-query.dto';
import { canAccessPastoral, isCoordinator, normalizeRole } from './utils/schedule-rules.util';
import {
  assertVolunteersBelong, assertWritable, findVolunteerConflicts, getLinkedPastoralGroupIds,
  loadSource, lockSchedule, lockSource,
} from './utils/schedule-db.util';

const EXPORT_MAX_ROWS = 5000;
const MAX_PERIOD_DAYS = 366;

const SCHEDULE_INCLUDE = {
  mass: { select: { id: true, title: true, dateTime: true } },
  event: { select: { id: true, name: true, startDate: true, status: true } },
  pastoralGroup: { select: { id: true, name: true } },
  assignments: { orderBy: { id: 'asc' }, include: { volunteer: { select: { id: true, name: true } } } },
} satisfies Prisma.ScheduleInclude;

// Relatório: só nome do voluntário (sem telefone/e-mail — LGPD, RNF007).
const EXPORT_INCLUDE = {
  mass: { select: { title: true, dateTime: true } },
  event: { select: { name: true, startDate: true } },
  pastoralGroup: { select: { name: true } },
  assignments: { orderBy: { id: 'asc' }, include: { volunteer: { select: { name: true } } } },
} satisfies Prisma.ScheduleInclude;

const dateOf = (s: { mass: { dateTime: Date } | null; event: { startDate: Date } | null }) =>
  (s.mass?.dateTime ?? s.event?.startDate)?.getTime() ?? 0;

@Injectable()
export class SchedulesService {
  constructor(private readonly prismaService: PrismaService) {}

  // ------------------------------------------------------------------ create
  async create(dto: CreateScheduleDto, user: AuthUser) {
    const { massId, eventId, pastoralGroupId: bodyPastoralId } = dto;
    const hasMass = massId != null;
    const hasEvent = eventId != null;

    // RN007: Missa XOR Evento (também garantido por CHECK no banco)
    if (hasMass === hasEvent) {
      throw new BadRequestException('A Escala deve estar vinculada a uma Missa OU a um Evento, nunca ambos nem nenhum (RN007).');
    }

    const assignments = (dto.assignments ?? []).map((a) => ({ volunteerId: a.volunteerId, role: normalizeRole(a.role ?? '') }));
    if (assignments.length === 0) throw new BadRequestException('A Escala precisa de pelo menos 1 atribuição.');
    const seen = new Set<string>();
    for (const a of assignments) {
      if (!a.role) throw new BadRequestException('Toda atribuição precisa de uma função.');
      const key = `${a.volunteerId}:${a.role}`;
      if (seen.has(key)) {
        throw new BadRequestException(`Atribuição duplicada no request: volunteerId=${a.volunteerId}, role="${a.role}".`);
      }
      seen.add(key);
    }

    // Coordenador: SEMPRE a pastoral do token (body ignorado -> não dá para forjar)
    const coordinator = isCoordinator(user);
    const pastoralGroupId = coordinator ? user.pastoralGroupId : (bodyPastoralId ?? null);
    if (pastoralGroupId == null) {
      if (coordinator) throw new ForbiddenException('Seu usuário não está vinculado a nenhuma Pastoral.');
      throw new BadRequestException('Informe a Pastoral da escala (pastoralGroupId).');
    }

    const ref = { massId: massId ?? null, eventId: eventId ?? null };

    try {
      const { schedule, source } = await this.prismaService.$transaction(async (tx) => {
        // Lock na Missa/Evento: serializa com (a) outra criação para a mesma origem,
        // (b) desvínculo de Pastoral e (c) exclusão da Missa/Evento (mesmo padrão do Dia 4/5).
        await lockSource(tx, ref);
        const source = await loadSource(tx, ref);

        // RN017 (revalidada DENTRO do lock)
        const linked = await getLinkedPastoralGroupIds(tx, ref);
        if (!linked.includes(pastoralGroupId)) {
          const msg = 'A Pastoral não está vinculada a esta Missa/Evento (RN017).';
          throw coordinator ? new ForbiddenException(msg) : new BadRequestException(msg);
        }

        assertWritable(source, user);

        const exists = await tx.schedule.findFirst({ where: { ...ref, pastoralGroupId }, select: { id: true } });
        if (exists) throw new ConflictException('Esta Pastoral já possui escala para esta Missa/Evento.');

        await assertVolunteersBelong(tx, assignments.map((a) => a.volunteerId), pastoralGroupId);

        const created = await tx.schedule.create({ data: { ...ref, pastoralGroupId } });
        await tx.scheduleAssignment.createMany({ data: assignments.map((a) => ({ scheduleId: created.id, ...a })) });
        const schedule = await tx.schedule.findUniqueOrThrow({ where: { id: created.id }, include: SCHEDULE_INCLUDE });
        return { schedule, source };
      });

      const warnings = await findVolunteerConflicts(this.prismaService, source, assignments.map((a) => a.volunteerId));
      return { ...schedule, warnings };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Rede de segurança: o UNIQUE (origem + pastoral) é a defesa final contra corrida
        if (error.code === 'P2002') throw new ConflictException('Esta Pastoral já possui escala para esta Missa/Evento.');
        if (error.code === 'P2003') throw new BadRequestException('Missa, Evento, Pastoral ou Voluntário informado não existe.');
      }
      throw error;
    }
  }

  // ------------------------------------------------------------------ leitura
  /** where único para tela e export (corrige search+datas colidindo no mesmo OR). */
  private buildWhere(user: AuthUser, q: ScheduleQueryDto): Prisma.ScheduleWhereInput {
    const and: Prisma.ScheduleWhereInput[] = [];

    if (isCoordinator(user)) {
      // sem pastoral => nada (id IN () nunca casa)
      and.push(user.pastoralGroupId == null ? { id: { in: [] } } : { pastoralGroupId: user.pastoralGroupId });
    } else if (q.pastoralGroupId) {
      and.push({ pastoralGroupId: q.pastoralGroupId });
    }

    if (q.massId) and.push({ massId: q.massId });
    if (q.eventId) and.push({ eventId: q.eventId });
    if (q.volunteerId) and.push({ assignments: { some: { volunteerId: q.volunteerId } } });

    if (q.search) {
      const contains = { contains: q.search, mode: 'insensitive' as const };
      and.push({
        OR: [
          { assignments: { some: { volunteer: { name: contains } } } },
          { mass: { title: contains } },
          { event: { name: contains } },
          { pastoralGroup: { name: contains } },
        ],
      });
    }

    const range = buildDateRangeFilter(q.startDate, q.endDate);
    if (range) and.push({ OR: [{ mass: { dateTime: range } }, { event: { startDate: range } }] });

    return and.length > 0 ? { AND: and } : {};
  }

  /**
   * Ordenação cronológica real (Missa e Evento misturados): o Prisma não ordena por
   * COALESCE de duas relações, então busca só (id + data), ordena e pagina em memória,
   * e depois carrega as linhas completas só da página. Volume paroquial: ok (revisar no Bloco 3).
   */
  async findAll(user: AuthUser, query: ScheduleQueryDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, order = 'desc' } = query;
    const where = this.buildWhere(user, query);

    const keys = await this.prismaService.schedule.findMany({
      where,
      select: { id: true, mass: { select: { dateTime: true } }, event: { select: { startDate: true } } },
    });
    const dir = order === 'asc' ? 1 : -1;
    const sorted = keys
      .map((k) => ({ id: k.id, at: dateOf(k) }))
      .sort((a, b) => dir * (a.at - b.at) || a.id.localeCompare(b.id));

    const pageIds = sorted.slice((page - 1) * limit, page * limit).map((s) => s.id);
    const rows = pageIds.length
      ? await this.prismaService.schedule.findMany({ where: { id: { in: pageIds } }, include: SCHEDULE_INCLUDE })
      : [];
    const byId = new Map(rows.map((r) => [r.id, r]));
    const data = pageIds.map((id) => byId.get(id)).filter((r): r is NonNullable<typeof r> => !!r);

    return { data, total: sorted.length, page, limit, totalPages: Math.ceil(sorted.length / limit) };
  }

  async findAllForExport(user: AuthUser, query: ScheduleQueryDto) {
    const rows = await this.prismaService.schedule.findMany({
      where: this.buildWhere(user, query),
      take: EXPORT_MAX_ROWS + 1,
      include: EXPORT_INCLUDE,
    });
    if (rows.length > EXPORT_MAX_ROWS) {
      throw new BadRequestException(`O relatório excede ${EXPORT_MAX_ROWS} escalas. Refine os filtros (período/pastoral).`);
    }
    return rows.sort((a, b) => dateOf(a) - dateOf(b));
  }

  async findOne(id: string, user: AuthUser) {
    const schedule = await this.prismaService.schedule.findUnique({ where: { id }, include: SCHEDULE_INCLUDE });
    if (!schedule) throw new NotFoundException('Escala não encontrada');
    if (!canAccessPastoral(user, schedule.pastoralGroupId)) {
      throw new ForbiddenException('Você não tem acesso a esta escala.');
    }
    return schedule;
  }

  // ------------------------------------------------------------------ remove (UC022)
  async remove(id: string, user: AuthUser) {
    return this.prismaService.$transaction(async (tx) => {
      await lockSchedule(tx, id); // serializa com edição de atribuições
      const schedule = await tx.schedule.findUniqueOrThrow({
        where: { id },
        select: { id: true, massId: true, eventId: true, pastoralGroupId: true, _count: { select: { assignments: true } } },
      });
      if (!canAccessPastoral(user, schedule.pastoralGroupId)) {
        throw new ForbiddenException('Você não tem acesso a esta escala.');
      }
      // Escala de evento cancelado pode (e deve) ser removida; histórico passado só Admin/Secretaria.
      const source = await loadSource(tx, schedule);
      assertWritable(source, user, { allowCancelled: true });

      await tx.schedule.delete({ where: { id } }); // atribuições caem em cascata, mesma transação
      return {
        id: schedule.id,
        massId: schedule.massId,
        eventId: schedule.eventId,
        pastoralGroupId: schedule.pastoralGroupId,
        removedAssignments: schedule._count.assignments,
      };
    });
  }

  // ------------------------------------------------------------------ cobertura / pendências
  private parsePeriod(q: CoverageQueryDto) {
    const start = new Date(q.start);
    const end = new Date(q.end);
    if (start.getTime() > end.getTime()) throw new BadRequestException('start deve ser anterior ou igual a end.');
    if (end.getTime() - start.getTime() > MAX_PERIOD_DAYS * 86_400_000) {
      throw new BadRequestException(`Período máximo: ${MAX_PERIOD_DAYS} dias.`);
    }
    return { start, end };
  }

  /** 1 linha por Missa/Evento ATIVO, com o status de cada pastoral vinculada. */
  async findCoverage(query: CoverageQueryDto, user: AuthUser) {
    const { start, end } = this.parsePeriod(query);
    const coordinator = isCoordinator(user);
    if (coordinator && user.pastoralGroupId == null) return [];
    const scopedId = coordinator ? user.pastoralGroupId! : query.pastoralGroupId;

    const pastoralGroups = {
      where: scopedId ? { pastoralGroupId: scopedId } : undefined,
      select: { pastoralGroupId: true, pastoralGroup: { select: { name: true } } },
    };
    const linkFilter = scopedId ? { pastoralGroups: { some: { pastoralGroupId: scopedId } } } : {};

    const [masses, events] = await Promise.all([
      this.prismaService.mass.findMany({
        where: { dateTime: { gte: start, lte: end }, ...linkFilter },
        orderBy: { dateTime: 'asc' },
        select: { id: true, title: true, dateTime: true, pastoralGroups, schedules: { select: { pastoralGroupId: true } } },
      }),
      this.prismaService.event.findMany({
        where: { startDate: { gte: start, lte: end }, status: 'ACTIVE', ...linkFilter }, // cancelado não gera pendência
        orderBy: { startDate: 'asc' },
        select: { id: true, name: true, startDate: true, pastoralGroups, schedules: { select: { pastoralGroupId: true } } },
      }),
    ]);

    const build = (
      sourceType: 'MASS' | 'EVENT', sourceId: number, title: string, date: Date,
      links: { pastoralGroupId: number; pastoralGroup: { name: string } }[],
      schedules: { pastoralGroupId: number }[],
    ) => {
      const done = new Set(schedules.map((s) => s.pastoralGroupId));
      const pastorals = links.map((l) => ({ id: l.pastoralGroupId, name: l.pastoralGroup.name, scheduled: done.has(l.pastoralGroupId) }));
      const status = pastorals.length === 0 ? 'NO_PASTORAL' : pastorals.every((p) => p.scheduled) ? 'COMPLETE' : 'INCOMPLETE';
      return { sourceType, sourceId, title, date, status, pastorals };
    };

    return [
      ...masses.map((m) => build('MASS', m.id, m.title, m.dateTime, m.pastoralGroups, m.schedules)),
      ...events.map((e) => build('EVENT', e.id, e.name, e.startDate, e.pastoralGroups, e.schedules)),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /** LEGADO: mesma lógica da cobertura, achatada (1 query a menos, sem o "findMany sem escopo"). */
  async findPending(query: CoverageQueryDto, user: AuthUser) {
    const items = await this.findCoverage(query, user);
    return items.flatMap((i) =>
      i.pastorals.filter((p) => !p.scheduled).map((p) => ({
        sourceType: i.sourceType, sourceId: i.sourceId, sourceTitle: i.title, sourceDate: i.date,
        pastoralGroupId: p.id, pastoralGroupName: p.name,
      })),
    );
  }
}