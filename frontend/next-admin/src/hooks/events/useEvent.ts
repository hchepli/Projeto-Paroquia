// src/hooks/events/useEvent.ts
import { useQuery } from '@tanstack/react-query';
import { Event } from '@/types/events/events';

async function fetchEvent(id: number): Promise<Event> {
  const res = await fetch(`/api/events/${id}`);
  if (!res.ok) throw new Error('Erro ao buscar evento.');
  return res.json();
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => fetchEvent(id),
    enabled: !!id,
  });
}