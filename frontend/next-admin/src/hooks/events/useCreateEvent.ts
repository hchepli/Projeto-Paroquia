// src/hooks/events/useCreateEvent.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminEvent } from '@/types/events/events';
import { EventPayload } from '@/lib/events/form';
import { throwApiError } from '@/lib/errors';

async function createEvent(input: EventPayload): Promise<AdminEvent> {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) await throwApiError(res, 'Erro ao criar evento.');
  return res.json();
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}