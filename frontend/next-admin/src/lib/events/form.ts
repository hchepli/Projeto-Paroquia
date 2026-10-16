// src/lib/events/form.ts
import { toDateTimeLocalValue, toIsoWithOffset } from '@/lib/date/datetime';
import { ApiError, getFriendlyErrorMessage } from '@/lib/errors';
import { AdminEvent, EventStatus } from '@/types/events/events';

export interface EventFormValues {
  name: string;
  description: string;
  startDate: string; // datetime-local
  endDate: string;
  location: string;
  categoryId: string;
  massId: string;
  pastoralGroupIds: number[];
  status: EventStatus;
}

export const EMPTY_EVENT_FORM: EventFormValues = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  location: '',
  categoryId: '',
  massId: '',
  pastoralGroupIds: [],
  status: 'ACTIVE',
};

export function eventToFormValues(event: AdminEvent): EventFormValues {
  return {
    name: event.name,
    description: event.description ?? '',
    startDate: toDateTimeLocalValue(event.startDate), // hora LOCAL (corrige bug do slice UTC)
    endDate: event.endDate ? toDateTimeLocalValue(event.endDate) : '',
    location: event.location,
    categoryId: String(event.categoryId ?? event.category?.id ?? ''),
    massId: String(event.massId ?? event.mass?.id ?? ''),
    pastoralGroupIds: (event.pastoralGroups ?? []).map((l) => l.pastoralGroup.id),
    status: event.status,
  };
}

export function validateEventForm(v: EventFormValues): string | null {
  if (!v.name.trim() || !v.startDate || !v.location.trim()) {
    return 'Preencha nome, data de início e local.';
  }
  if (v.endDate && new Date(v.endDate).getTime() < new Date(v.startDate).getTime()) {
    return 'A data de fim não pode ser anterior ao início.';
  }
  return null;
}

export interface EventPayload {
  name?: string;
  description?: string | null;
  startDate?: string;
  endDate?: string | null;
  location?: string;
  massId?: number | null;
  categoryId?: number | null;
  pastoralGroupIds?: number[];
  status?: EventStatus;
}

/**
 * create: campos vazios são omitidos.
 * edit: campos vazios viram null/'' para REMOVER (endDate, massId, categoryId)
 * e pastoralGroupIds vai sempre (substitui o conjunto; [] limpa).
 */
export function buildEventPayload(v: EventFormValues, mode: 'create' | 'edit'): EventPayload {
  const base = {
    name: v.name.trim(),
    startDate: toIsoWithOffset(v.startDate),
    location: v.location.trim(),
  };

  if (mode === 'create') {
    return {
      ...base,
      description: v.description.trim() || undefined,
      endDate: v.endDate ? toIsoWithOffset(v.endDate) : undefined,
      massId: v.massId ? Number(v.massId) : undefined,
      categoryId: v.categoryId ? Number(v.categoryId) : undefined,
      pastoralGroupIds: v.pastoralGroupIds.length > 0 ? v.pastoralGroupIds : undefined,
    };
  }

  return {
    ...base,
    description: v.description.trim(),
    endDate: v.endDate ? toIsoWithOffset(v.endDate) : null,
    massId: v.massId ? Number(v.massId) : null,
    categoryId: v.categoryId ? Number(v.categoryId) : null,
    pastoralGroupIds: v.pastoralGroupIds,
    status: v.status,
  };
}

export function getEventSaveError(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.status === 409 && /pastoral|escala/i.test(err.message)) {
    return `${err.message} Remova a escala dessa Pastoral (página Escalas) antes de desvinculá-la.`;
  }
  return getFriendlyErrorMessage(err, fallback);
}

export function eventOptionLabel(e: { name: string; status?: EventStatus }): string {
  return e.status === 'CANCELLED' ? `${e.name} (cancelado)` : e.name;
}