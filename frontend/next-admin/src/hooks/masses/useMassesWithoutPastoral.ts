// src/hooks/masses/useMassesWithoutPastoral.ts
import { useQuery } from '@tanstack/react-query';
import { Mass } from '@/types/masses/masses';
import { throwApiError } from '@/lib/errors';

interface UseMassesWithoutPastoralParams {
  startDate: string;
  endDate: string;
  /** Endpoint restrito a Admin Geral/Secretaria: passe false para os demais cargos. */
  enabled?: boolean;
}

interface MassesWithoutPastoralResult {
  data: Mass[];
  total: number;
}

async function fetchMassesWithoutPastoral(
  params: Pick<UseMassesWithoutPastoralParams, 'startDate' | 'endDate'>,
): Promise<MassesWithoutPastoralResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);

  const res = await fetch(`/api/masses/without-pastoral?${searchParams.toString()}`);
  if (!res.ok) await throwApiError(res, 'Erro ao buscar missas sem pastoral.');
  return res.json();
}

export function useMassesWithoutPastoral({
  startDate,
  endDate,
  enabled = true,
}: UseMassesWithoutPastoralParams) {
  return useQuery({
    queryKey: ['masses', 'without-pastoral', { startDate, endDate }],
    queryFn: () => fetchMassesWithoutPastoral({ startDate, endDate }),
    enabled,
  });
}
