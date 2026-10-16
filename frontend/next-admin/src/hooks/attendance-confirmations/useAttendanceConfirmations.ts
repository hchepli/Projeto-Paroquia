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

async function fetchConfirmations(
  params: UseAttendanceConfirmationsParams,
): Promise<AttendanceConfirmationsPage> {
  const query = new URLSearchParams();
  const { enabled: _enabled, ...rest } = params;
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });

  const res = await fetch(`/api/attendance-confirmations?${query.toString()}`);
  if (!res.ok) await throwApiError(res, 'Erro ao buscar confirmações de presença.');
  return res.json();
}

export function useAttendanceConfirmations(params: UseAttendanceConfirmationsParams) {
  return useQuery({
    queryKey: ['attendance-confirmations', params],
    queryFn: () => fetchConfirmations(params),
    enabled: params.eventId !== null && (params.enabled ?? true),
    retry: (count, err) => !(err as { status?: number }).status && count < 2, // não repete 4xx
  });
}