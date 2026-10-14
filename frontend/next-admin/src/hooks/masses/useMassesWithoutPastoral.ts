import { useQuery } from '@tanstack/react-query';
import { Mass } from '@/types/masses/masses'; // ajustar path se o tipo Mass estiver em outro lugar

interface UseMassesWithoutPastoralParams {
  startDate: string;
  endDate: string;
}

interface MassesWithoutPastoralResult {
  data: Mass[];
  total: number;
}

async function fetchMassesWithoutPastoral(
  params: UseMassesWithoutPastoralParams,
): Promise<MassesWithoutPastoralResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);

  const res = await fetch(`/api/masses/without-pastoral?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Erro ao buscar missas sem pastoral.');
  return res.json();
}

export function useMassesWithoutPastoral(params: UseMassesWithoutPastoralParams) {
  return useQuery({
    queryKey: ['masses', 'without-pastoral', params],
    queryFn: () => fetchMassesWithoutPastoral(params),
  });
}
