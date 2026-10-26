import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ScheduleWithWarnings } from '@/types/schedules/schedule';
import { CreateScheduleInput } from '@/types/schedules/create-schedule';
import { parseApiError } from '@/lib/api-error';
import { invalidateScheduleQueries } from './useScheduleMutations';

async function createSchedule(input: CreateScheduleInput): Promise<ScheduleWithWarnings> {
  const res = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseApiError(res, 'Erro ao registrar escala.');
  return res.json();
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSchedule,
    onSuccess: () => invalidateScheduleQueries(queryClient),
  });
}