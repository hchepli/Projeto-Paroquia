// src/hooks/events/useEvents.ts
import { useQuery } from '@tanstack/react-query';
import { AdminEvent, EventStatus } from '@/types/events/events';
import { PaginatedResult } from '@/types/pagination';
import { throwApiError } from '@/lib/errors';

export interface UseEventsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'startDate' | 'name';
  order?: 'asc' | 'desc'; // ignorado pelo back quando há `period`
  period?: 'upcoming' | 'past';
  status?: EventStatus;
  categoryId?: number;
}

async function fetchEvents(params: UseEventsParams): Promise<PaginatedResult<AdminEvent>> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });

  const res = await fetch(`/api/events/admin?${query.toString()}`);
  if (!res.ok) await throwApiError(res, 'Erro ao buscar eventos.');
  return res.json();
}

/** Lista ADMIN (todos os status). A lista pública vive no site público. */
export function useEvents(params: UseEventsParams = { limit: 100 }) {
  return useQuery({
    queryKey: ['events', 'list', params],
    queryFn: () => fetchEvents(params),
  });
}