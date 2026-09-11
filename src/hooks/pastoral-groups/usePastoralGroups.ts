// src/hooks/pastoral-groups/usePastoralGroups.ts
import { useQuery } from '@tanstack/react-query';
import { PastoralGroup } from '@/types/pastoral-groups/pastoral-group';

async function fetchPastoralGroups(): Promise<PastoralGroup[]> {
  const res = await fetch('/api/pastoral-groups');
  if (!res.ok) throw new Error('Erro ao buscar pastorais');
  return res.json();
}

export function usePastoralGroups() {
  return useQuery({ queryKey: ['pastoral-groups'], queryFn: fetchPastoralGroups });
}