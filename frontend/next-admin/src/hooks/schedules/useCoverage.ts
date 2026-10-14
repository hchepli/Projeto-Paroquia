import { useQuery } from '@tanstack/react-query';

export interface CoveragePastoral {
  id: number;
  name: string;
  scheduled: boolean;
}

export interface CoverageItem {
  sourceType: 'MASS' | 'EVENT';
  sourceId: number;
  title: string;
  date: string;
  status: 'COMPLETE' | 'INCOMPLETE' | 'NO_PASTORAL';
  pastorals: CoveragePastoral[];
}

interface UseCoverageParams {
  startDate: string;
  endDate: string;
  pastoralGroupId?: number;
}

async function fetchCoverage(params: UseCoverageParams): Promise<CoverageItem[]> {
  const query = new URLSearchParams({ start: params.startDate, end: params.endDate });
  if (params.pastoralGroupId !== undefined) query.set('pastoralGroupId', String(params.pastoralGroupId));

  const res = await fetch(`/api/schedules/coverage?${query.toString()}`);
  if (!res.ok) throw new Error('Erro ao buscar cobertura de escalas.');
  return res.json();
}

export function useCoverage(params: UseCoverageParams) {
  return useQuery({
    queryKey: ['schedules-coverage', params],
    queryFn: () => fetchCoverage(params),
  });
}