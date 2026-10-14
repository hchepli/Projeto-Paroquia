// src/hooks/events/useEvents.ts
import { useQuery } from '@tanstack/react-query';
import { Event } from '@/types/events/events';
import { PaginatedResult } from '@/types/pagination';

export interface UseEventsParams {
  page?: number;
  limit?: number;
  search?: string;
  includeAll?: boolean;
}

async function fetchEvents(params: UseEventsParams): Promise<PaginatedResult<Event>> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });

  const res = await fetch(`/api/events?${query.toString()}`);
  if (!res.ok) throw new Error('Erro ao buscar eventos.');
  return res.json();
}

export function useEvents(params: UseEventsParams = { limit: 100 }) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => fetchEvents(params),
  });
}