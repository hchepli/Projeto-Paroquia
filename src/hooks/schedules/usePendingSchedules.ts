import { useQuery } from '@tanstack/react-query';

export interface PendingScheduleItem {
  sourceType: 'MASS' | 'EVENT';
  sourceId: number;
  sourceTitle: string;
  sourceDate: string;
  pastoralGroupId: number;
  pastoralGroupName: string;
}

interface UsePendingSchedulesParams {
  startDate?: string;
  endDate?: string;
  pastoralGroupId?: number;
}

async function fetchPendingSchedules(params: UsePendingSchedulesParams): Promise<PendingScheduleItem[]> {
  const query = new URLSearchParams();
  if (params.startDate) query.set('start', params.startDate);
  if (params.endDate) query.set('end', params.endDate);
  if (params.pastoralGroupId !== undefined) query.set('pastoralGroupId', String(params.pastoralGroupId));

  const res = await fetch(`/api/schedules/pending?${query.toString()}`);
  if (!res.ok) throw new Error('Erro ao buscar escalas pendentes.');
  return res.json();
}

export function usePendingSchedules(params: UsePendingSchedulesParams) {
  return useQuery({
    queryKey: ['schedules-pending', params],
    queryFn: () => fetchPendingSchedules(params),
  });
}