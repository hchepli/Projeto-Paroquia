import { useQuery } from '@tanstack/react-query';
import { Schedule } from '@/types/schedules/schedule';
import { parseApiError } from '@/lib/api-error';

async function fetchSchedule(id: string): Promise<Schedule> {
  const res = await fetch(`/api/schedules/${id}`);
  if (!res.ok) throw await parseApiError(res, 'Erro ao buscar escala.');
  return res.json();
}

export function useSchedule(id: string) {
  return useQuery({ queryKey: ['schedule', id], queryFn: () => fetchSchedule(id), enabled: !!id });
}