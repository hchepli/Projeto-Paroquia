// src/hooks/masses/useMass.ts
import { useQuery } from '@tanstack/react-query';
import { MassDetail } from '@/types/masses/masses';
import { throwApiError } from '@/lib/errors';

async function fetchMass(id: number): Promise<MassDetail> {
  const res = await fetch(`/api/masses/${id}`);
  if (!res.ok) await throwApiError(res, 'Erro ao buscar missa.');
  return res.json();
}

export function useMass(id: number | null) {
  return useQuery({
    queryKey: ['mass', id],
    queryFn: () => fetchMass(id!),
    enabled: id !== null,
  });
}
