// src/hooks/events/useUpdateEvent.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Event } from '@/types/events/events';

interface UpdateEventInput {
  id: number;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  massId?: number | null;
  status?: 'ACTIVE' | 'CANCELLED';
}

async function updateEvent({ id, ...rest }: UpdateEventInput): Promise<Event> {
  const res = await fetch(`/api/events/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rest),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? 'Erro ao atualizar evento.');
  return data;
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEvent,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', variables.id] });
    },
  });
}