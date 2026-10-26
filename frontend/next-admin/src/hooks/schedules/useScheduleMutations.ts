import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { parseApiError } from '@/lib/api-error';
import { ScheduleWarning } from '@/types/schedules/schedule';

/** Tudo que depende de escala: lista, cobertura, pendentes, resumo, detalhe e calendário. */
export function invalidateScheduleQueries(qc: QueryClient) {
  for (const key of ['schedules', 'schedule', 'schedules-coverage', 'schedules-pending', 'schedules-summary', 'calendar']) {
    qc.invalidateQueries({ queryKey: [key] });
  }
}

async function send<T>(url: string, method: string, body: unknown, fallback: string): Promise<T> {
  const res = await fetch(url, {
    method,
    ...(body !== undefined && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  if (!res.ok) throw await parseApiError(res, fallback);
  return res.json();
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => send(`/api/schedules/${id}`, 'DELETE', undefined, 'Erro ao remover escala.'),
    onSuccess: () => invalidateScheduleQueries(qc),
  });
}

export function useAddAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { scheduleId: string; volunteerId: number; role: string }) =>
      send<{ warnings: ScheduleWarning[] }>('/api/schedule-assignment', 'POST', input, 'Erro ao adicionar atribuição.'),
    onSuccess: () => invalidateScheduleQueries(qc),
  });
}

export function useRemoveAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => send(`/api/schedule-assignment/${id}`, 'DELETE', undefined, 'Erro ao remover atribuição.'),
    onSuccess: () => invalidateScheduleQueries(qc),
  });
}