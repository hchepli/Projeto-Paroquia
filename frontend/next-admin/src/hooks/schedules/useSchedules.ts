// src/hooks/schedules/useSchedules.ts
import { useQuery } from '@tanstack/react-query';
import { Schedule } from '@/types/schedules/schedule';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UseSchedulesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  massId?: number;
  eventId?: number;
  volunteerId?: number;
  pastoralGroupId?: number;
  startDate?: string;
  endDate?: string;
}

async function fetchSchedules(params: UseSchedulesParams): Promise<PaginatedResult<Schedule>> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const res = await fetch(`/api/schedules?${query.toString()}`);
  if (!res.ok) throw new Error('Erro ao buscar escalas');
  return res.json();
}

export function useSchedules(params: UseSchedulesParams) {
  return useQuery({
    queryKey: ['schedules', params],
    queryFn: () => fetchSchedules(params),
  });
}