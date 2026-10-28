// src/hooks/attendance-confirmations/useAttendanceConfirmations.ts
import { useQuery } from '@tanstack/react-query';
import { AttendanceConfirmationsPage } from '@/types/attendance-confirmations/attendance-confirmation';
import { throwApiError } from '@/lib/errors';

export interface UseAttendanceConfirmationsParams {
  eventId: number | null;
  page?: number;
  limit?: number;
  search?: string;
  order?: 'asc' | 'desc';
  enabled?: boolean;
}

type FetchParams = Omit<UseAttendanceConfirmationsParams, 'enabled'>;

async function fetchConfirmations(params: FetchParams): Promise<AttendanceConfirmationsPage> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });

  const res = await fetch(`/api/attendance-confirmations?${query.toString()}`);
  if (!res.ok) await throwApiError(res, 'Erro ao buscar confirmações de presença.');
  return res.json();
}

export function useAttendanceConfirmations({
  enabled = true,
  ...params
}: UseAttendanceConfirmationsParams) {
  return useQuery({
    // `enabled` fora da key: alternar a permissão não cria entrada de cache nova.
    queryKey: ['attendance-confirmations', params],
    queryFn: () => fetchConfirmations(params),
    enabled: params.eventId !== null && enabled,
    retry: (count, err) => !(err as { status?: number }).status && count < 2, // não repete 4xx
  });
}