// src/hooks/events/useEvent.ts
import { useQuery } from '@tanstack/react-query';
import { AdminEvent } from '@/types/events/events';
import { throwApiError } from '@/lib/errors';

async function fetchEvent(id: number): Promise<AdminEvent> {
  const res = await fetch(`/api/events/admin/${id}`);
  if (!res.ok) await throwApiError(res, 'Erro ao buscar evento.');
  return res.json();
}

export function useEvent(id: number | null) {
  return useQuery({
    queryKey: ['events', 'detail', id],
    queryFn: () => fetchEvent(id!),
    enabled: id !== null && Number.isFinite(id) && id > 0,
  });
}