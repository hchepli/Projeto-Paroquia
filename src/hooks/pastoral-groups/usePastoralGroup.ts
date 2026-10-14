// src/hooks/pastoral-groups/usePastoralGroup.ts
import { useQuery } from '@tanstack/react-query';
import { PastoralGroup } from '@/types/pastoral-groups/pastoral-group';
import { parseApiError } from '@/lib/api-error';

async function fetchPastoralGroup(id: number): Promise<PastoralGroup> {
  const res = await fetch(`/api/pastoral-groups/${id}`);
  if (!res.ok) throw await parseApiError(res, 'Erro ao buscar pastoral.');
  return res.json();
}

export function usePastoralGroup(id: number) {
  return useQuery({
    queryKey: ['pastoral-groups', 'detail', id],
    queryFn: () => fetchPastoralGroup(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}