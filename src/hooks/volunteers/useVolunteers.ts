// src/hooks/volunteers/useVolunteers.ts
import { useQuery } from '@tanstack/react-query';
import { Volunteer } from '@/types/volunteers/volunteer';
import { parseApiError } from '@/lib/api-error';

interface Params {
  pastoralGroupId?: number;
}

async function fetchVolunteers(params: Params): Promise<Volunteer[]> {
  const qs = params.pastoralGroupId ? `?pastoralGroupId=${params.pastoralGroupId}` : '';
  const res = await fetch(`/api/volunteers${qs}`);
  if (!res.ok) throw await parseApiError(res, 'Erro ao buscar voluntários.');
  return res.json();
}

export function useVolunteers(params: Params = {}) {
  return useQuery({
    queryKey: ['volunteers', params],
    queryFn: () => fetchVolunteers(params),
  });
}