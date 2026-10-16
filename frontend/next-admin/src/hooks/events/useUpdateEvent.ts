// src/hooks/events/useUpdateEvent.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminEvent } from '@/types/events/events';
import { EventPayload } from '@/lib/events/form';
import { throwApiError } from '@/lib/errors';

type UpdateEventInput = EventPayload & { id: number };

async function updateEvent({ id, ...rest }: UpdateEventInput): Promise<AdminEvent> {
  const res = await fetch(`/api/events/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rest),
  });
  if (!res.ok) await throwApiError(res, 'Erro ao atualizar evento.');
  return res.json();
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEvent,
    onSuccess: () => {
      // ['events'] cobre lista e detalhe; cancelar/reativar muda o calendário.
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}