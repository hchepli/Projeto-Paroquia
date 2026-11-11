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
    startDate: toDateTimeLocalValue(event.startDate), // hora LOCAL
    endDate: event.endDate ? toDateTimeLocalValue(event.endDate) : '',
    location: event.location,
    categoryId: String(event.categoryId ?? event.category?.id ?? ''),
    massId: String(event.massId ?? event.mass?.id ?? ''),
    pastoralGroupIds: (event.pastoralGroups ?? []).map((l) => l.pastoralGroup.id),
    status: event.status,
  };
}

/** Devolve a primeira mensagem de erro (em frase simples) ou null se estiver tudo certo. */
export function validateEventForm(v: EventFormValues): string | null {
  const name = v.name.trim();
  const location = v.location.trim();

  if (!name) return 'Escreva o nome do evento.';
  if (name.length > 150) return 'O nome do evento pode ter no máximo 150 letras.';
  if (!v.startDate) return 'Escolha o dia e a hora em que o evento começa.';
  if (!location) return 'Escreva o local do evento.';
  if (location.length > 180) return 'O local pode ter no máximo 180 letras.';
  if (v.description.trim().length > 5000) {
    return 'A descrição está muito longa. Encurte o texto e tente de novo.';
  }
  if (v.endDate && new Date(v.endDate).getTime() < new Date(v.startDate).getTime()) {
    return 'O evento não pode terminar antes de começar. Confira o dia e a hora de término.';
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
 * create: campos vazios são omitidos. O slug nunca é enviado: o back gera sozinho a partir do nome.
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

/** Código do 409 ao desvincular Pastoral que já tem Escala (back: events.service). */
export const PASTORAL_HAS_SCHEDULE_CODE = 'EVENT_PASTORAL_HAS_SCHEDULE';

/** Nomes das pastorais do 409: usa `pastoralNames` se o back mandar; senão extrai da mensagem. */
function extractPastoralNames(err: ApiError): string | null {
  const body = err.body as { pastoralNames?: string[] } | null;
  if (body?.pastoralNames?.length) return body.pastoralNames.join(', ');
  const match = /desvincular:\s*(.+?)\s+já possui/i.exec(err.message);
  return match ? match[1] : null;
}

export function getEventSaveError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 409) {
      const code = (err.body as { code?: string } | null)?.code;
      // Regex fica como fallback enquanto o back sem `code` ainda estiver em uso.
      if (code === PASTORAL_HAS_SCHEDULE_CODE || (!code && /pastoral|escala/i.test(err.message))) {
        const names = extractPastoralNames(err);
        return names
          ? `Não deu para salvar. Esta pastoral não pode ser tirada da lista porque já existe escala dela neste evento: ${names}. Para tirá-la, apague antes a escala dela na página Escalas.`
          : 'Não deu para salvar. Uma pastoral que você tirou da lista já tem escala neste evento. Para tirá-la, apague antes a escala dela na página Escalas.';
      }
      if (/slug/i.test(err.message)) {
        return 'Já existe um evento com um nome muito parecido. Mude um pouco o nome (por exemplo, acrescente o ano) e tente de novo.';
      }
    }
    if (err.status === 400 && /missa informada/i.test(err.message)) {
      return 'A missa escolhida não existe mais. Escolha outra missa ou deixe o campo vazio.';
    }
    if (err.status === 400 && /categoria informada/i.test(err.message)) {
      return 'A categoria escolhida não está disponível. Escolha outra ou deixe o campo vazio.';
    }
    if (err.status === 400 && /pastorais informadas/i.test(err.message)) {
      return 'Uma das pastorais escolhidas não existe mais. Atualize a página e escolha de novo.';
    }
    if (err.status === 403) {
      return 'Você não tem permissão para fazer isso. Fale com o Admin Geral ou com a Secretaria.';
    }
  }
  return getFriendlyErrorMessage(err, fallback);
}

export function eventOptionLabel(e: { name: string; status?: EventStatus }): string {
  return e.status === 'CANCELLED' ? `${e.name} (cancelado)` : e.name;
}
