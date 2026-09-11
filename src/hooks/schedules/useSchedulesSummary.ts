// src/hooks/schedules/useSchedulesSummary.ts
import { useQuery } from '@tanstack/react-query';
import { Schedule } from '@/types/schedules/schedule';

interface UseSchedulesSummaryParams {
  startDate?: string;
  endDate?: string;
  pastoralGroupId?: number;
}

async function fetchSchedulesSummary(params: UseSchedulesSummaryParams): Promise<Schedule[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });
  const res = await fetch(`/api/schedules/summary?${query.toString()}`);
  if (!res.ok) throw new Error('Erro ao buscar resumo de escalas.');
  return res.json();
}

export function useSchedulesSummary(params: UseSchedulesSummaryParams) {
  return useQuery({
    queryKey: ['schedules-summary', params],
    queryFn: () => fetchSchedulesSummary(params),
  });
}