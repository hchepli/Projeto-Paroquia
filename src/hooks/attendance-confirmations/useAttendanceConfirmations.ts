// src/hooks/attendance-confirmations/useAttendanceConfirmations.ts
import { useQuery } from '@tanstack/react-query';
import { AttendanceConfirmation } from '@/types/attendance-confirmations/attendance-confirmation';

async function fetchAttendanceConfirmations(): Promise<AttendanceConfirmation[]> {
  const res = await fetch('/api/attendance-confirmations');
  if (!res.ok) throw new Error('Erro ao buscar confirmações de presença.');
  return res.json();
}

// TODO técnico: busca TODAS as confirmações e filtra no client por
// eventId. Migrar para filtro no backend se o volume crescer.
export function useAttendanceConfirmations() {
  return useQuery({
    queryKey: ['attendance-confirmations'],
    queryFn: fetchAttendanceConfirmations,
  });
}