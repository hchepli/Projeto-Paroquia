// src/hooks/events/useDeleteEvent.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EventDeleteResult } from '@/types/events/events';
import { throwApiError } from '@/lib/errors';

export interface EventScheduleConflict {
  id: number;
  pastoralGroup: string | { name: string };
  assignmentsCount: number;
}

/** Lançado quando o back responde 409 EVENT_HAS_SCHEDULES. */
export class EventHasSchedulesError extends Error {
  schedules: EventScheduleConflict[];
  linkedAlbums: { id: number; title: string }[];

  constructor(body: {
    message?: string;
    schedules?: EventScheduleConflict[];
    linkedAlbums?: { id: number; title: string }[];
  }) {
    super(body.message ?? 'Este evento possui escalas vinculadas.');
    this.name = 'EventHasSchedulesError';
    this.schedules = body.schedules ?? [];
    this.linkedAlbums = body.linkedAlbums ?? [];
  }
}

interface DeleteEventPayload {
  id: number;
  confirm?: boolean;
}

async function deleteEvent({ id, confirm }: DeleteEventPayload): Promise<EventDeleteResult> {
  const res = await fetch(`/api/events/${id}${confirm ? '?confirm=true' : ''}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    if (res.status === 409) {
      const body = await res.clone().json().catch(() => null);
      if (body?.code === 'EVENT_HAS_SCHEDULES') throw new EventHasSchedulesError(body);
    }
    await throwApiError(res, 'Erro ao remover evento.');
  }

  return res.json();
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: (_result, { id }) => {
      queryClient.removeQueries({ queryKey: ['events', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      // O back apaga escalas e confirmações em cascata e desvincula álbuns.
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-confirmations'] });
    },
  });
}