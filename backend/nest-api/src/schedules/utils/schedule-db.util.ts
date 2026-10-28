import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import type { AuthUser } from '../../auth/decorators/current-user.decorator';
import { isCoordinator } from './schedule-rules.util';

type Db = Prisma.TransactionClient;
type SourceRef = { massId?: number | null; eventId?: number | null };

const MASS_DURATION_MS = 2 * 60 * 60 * 1000; // Missa em andamento ainda conta como "não realizada"
const CONFLICT_WINDOW_MS = 60 * 60 * 1000;

export interface ScheduleSource {
  kind: 'MASS' | 'EVENT';
  id: number;
  title: string;
  startsAt: Date;
  endsAt: Date;
  cancelled: boolean;
  /** Missa e Evento correlacionado (RN002) são a MESMA celebração. */
  celebrationKey: string;
}

export interface ScheduleWarning {
  volunteerId: number;
  volunteerName: string;
  conflictsWith: {
    scheduleId: string;
    sourceType: 'MASS' | 'EVENT';
    title: string;
    date: Date;
  };
}

// ---------------------------------------------------------------- locks
export async function lockSchedule(tx: Db, id: string) {
  const rows = await tx.$queryRaw<
    { id: string }[]
  >`SELECT id FROM "escalas" WHERE id = CAST(${id} AS CHAR(36)) FOR UPDATE`;
  if (rows.length === 0) throw new NotFoundException('Escala não encontrada');
}

/** Mesmo lock do update/remove de Missa e Evento: serializa criação de Escala com desvínculo de Pastoral e exclusão. */
export async function lockSource(tx: Db, ref: SourceRef) {
  if (ref.massId != null) {
    const rows = await tx.$queryRaw<
      { id: number }[]
    >`SELECT id FROM "missas" WHERE id = ${ref.massId} FOR UPDATE`;
    if (rows.length === 0) throw new NotFoundException('Missa não encontrada');
  } else {
    const rows = await tx.$queryRaw<
      { id: number }[]
    >`SELECT id FROM "eventos" WHERE id = ${ref.eventId} FOR UPDATE`;
    if (rows.length === 0) throw new NotFoundException('Evento não encontrado');
  }
}

// ---------------------------------------------------------------- origem (Missa/Evento)
export async function loadSource(
  db: Db,
  ref: SourceRef,
): Promise<ScheduleSource> {
  if (ref.massId != null) {
    const m = await db.mass.findUnique({
      where: { id: ref.massId },
      select: { id: true, title: true, dateTime: true },
    });
    if (!m) throw new NotFoundException('Missa não encontrada');
    return {
      kind: 'MASS',
      id: m.id,
      title: m.title,
      startsAt: m.dateTime,
      endsAt: new Date(m.dateTime.getTime() + MASS_DURATION_MS),
      cancelled: false,
      celebrationKey: `M:${m.id}`,
    };
  }
  const e = await db.event.findUnique({
    where: { id: ref.eventId! },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      status: true,
      massId: true,
    },
  });
  if (!e) throw new NotFoundException('Evento não encontrado');
  return {
    kind: 'EVENT',
    id: e.id,
    title: e.name,
    startsAt: e.startDate,
    endsAt: e.endDate ?? e.startDate,
    cancelled: e.status === 'CANCELLED',
    celebrationKey: e.massId != null ? `M:${e.massId}` : `E:${e.id}`,
  };
}

/** Evento cancelado: ninguém altera (só remover a escala inteira). Já realizado: só Admin/Secretaria. */
export function assertWritable(
  source: ScheduleSource,
  user: AuthUser,
  opts: { allowCancelled?: boolean } = {},
) {
  if (source.cancelled && !opts.allowCancelled) {
    throw new ConflictException(
      'Este evento está cancelado; não é possível alterar a escala.',
    );
  }
  if (isCoordinator(user) && source.endsAt.getTime() < Date.now()) {
    throw new ConflictException(
      'Esta Missa/Evento já foi realizado. Apenas Admin Geral ou Secretaria alteram escalas retroativas.',
    );
  }
}

export async function getLinkedPastoralGroupIds(
  db: Db,
  ref: SourceRef,
): Promise<number[]> {
  const rows =
    ref.massId != null
      ? await db.massPastoralGroup.findMany({
          where: { massId: ref.massId },
          select: { pastoralGroupId: true },
        })
      : await db.eventPastoralGroup.findMany({
          where: { eventId: ref.eventId! },
          select: { pastoralGroupId: true },
        });
  return rows.map((r) => r.pastoralGroupId);
}

// ---------------------------------------------------------------- voluntários
export async function assertVolunteersBelong(
  db: Db,
  volunteerIds: number[],
  pastoralGroupId: number,
) {
  const ids = [...new Set(volunteerIds)];
  const found = await db.volunteer.findMany({
    where: { id: { in: ids } },
    select: { id: true, pastoralGroupId: true },
  });
  if (found.length !== ids.length)
    throw new BadRequestException('Algum Voluntário informado não existe.');
  if (found.some((v) => v.pastoralGroupId !== pastoralGroupId)) {
    throw new BadRequestException(
      'Todos os Voluntários da escala devem pertencer à Pastoral da escala.',
    );
  }
}

/** Aviso (não bloqueia): mesmo voluntário em outra celebração a ±60 min. */
export async function findVolunteerConflicts(
  db: Db,
  source: ScheduleSource,
  volunteerIds: number[],
): Promise<ScheduleWarning[]> {
  const ids = [...new Set(volunteerIds)];
  if (ids.length === 0) return [];
  const range = {
    gte: new Date(source.startsAt.getTime() - CONFLICT_WINDOW_MS),
    lte: new Date(source.startsAt.getTime() + CONFLICT_WINDOW_MS),
  };
  const rows = await db.scheduleAssignment.findMany({
    where: {
      volunteerId: { in: ids },
      schedule: {
        OR: [
          { mass: { dateTime: range } },
          { event: { startDate: range, status: 'ACTIVE' } },
        ],
      },
    },
    select: {
      volunteerId: true,
      volunteer: { select: { name: true } },
      schedule: {
        select: {
          id: true,
          mass: { select: { id: true, title: true, dateTime: true } },
          event: {
            select: { id: true, name: true, startDate: true, massId: true },
          },
        },
      },
    },
  });

  const out = new Map<string, ScheduleWarning>();
  for (const r of rows) {
    const { mass, event } = r.schedule;
    const key = mass
      ? `M:${mass.id}`
      : event!.massId != null
        ? `M:${event!.massId}`
        : `E:${event!.id}`;
    if (key === source.celebrationKey) continue;
    out.set(`${r.volunteerId}:${r.schedule.id}`, {
      volunteerId: r.volunteerId,
      volunteerName: r.volunteer.name,
      conflictsWith: {
        scheduleId: r.schedule.id,
        sourceType: mass ? 'MASS' : 'EVENT',
        title: mass?.title ?? event!.name,
        date: mass?.dateTime ?? event!.startDate,
      },
    });
  }
  return [...out.values()];
}
