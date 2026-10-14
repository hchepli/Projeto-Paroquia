// src/hooks/pastoral-groups/usePastoralGroups.ts
import { useQuery } from '@tanstack/react-query';
import { PastoralGroup } from '@/types/pastoral-groups/pastoral-group';
import { parseApiError } from '@/lib/api-error';

async function fetchPastoralGroups(): Promise<PastoralGroup[]> {
  const res = await fetch('/api/pastoral-groups');
  if (!res.ok) throw await parseApiError(res, 'Erro ao buscar pastorais.');
  return res.json();
}

/** `enabled: false` evita a busca quando a tela não precisa da lista (ex: Coordenador). */
export function usePastoralGroups(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['pastoral-groups'],
    queryFn: fetchPastoralGroups,
    enabled: options.enabled ?? true,
  });
}