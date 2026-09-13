import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Schedule } from '@/types/schedules/schedule';
import { CreateScheduleAssignmentInput } from '@/types/schedules/create-schedule';

export interface CreateScheduleInput {
  massId?: number;
  eventId?: number;
  assignments: CreateScheduleAssignmentInput[];
}

async function createSchedule(input: CreateScheduleInput): Promise<Schedule> {
  const res = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    if (res.status === 403) {
      throw new Error(
        body?.message ??
          'Sua Pastoral não está vinculada a esta Missa/Evento — você não pode criar Escala aqui.',
      );
    }
    throw new Error(body?.message ?? 'Erro ao registrar escala.');
  }

  return res.json();
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedules-pending'] });
      queryClient.invalidateQueries({ queryKey: ['schedules-summary'] });
    },
  });
}