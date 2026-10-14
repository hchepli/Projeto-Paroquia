// src/hooks/events/useCreateEvent.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Event } from '@/types/events/events';

interface CreateEventInput {
  name: string;
  slug?: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location: string;
  massId?: number;
}

async function createEvent(input: CreateEventInput): Promise<Event> {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? 'Erro ao criar evento.');
  return data;
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}