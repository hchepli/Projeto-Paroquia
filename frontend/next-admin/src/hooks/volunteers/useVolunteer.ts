// src/hooks/volunteers/useVolunteer.ts
import { useQuery } from '@tanstack/react-query';
import { Volunteer } from '@/types/volunteers/volunteer';
import { parseApiError } from '@/lib/api-error';

async function fetchVolunteer(id: number): Promise<Volunteer> {
  const res = await fetch(`/api/volunteers/${id}`);
  if (!res.ok) throw await parseApiError(res, 'Erro ao buscar voluntário.');
  return res.json();
}

export function useVolunteer(id: number) {
  return useQuery({
    queryKey: ['volunteers', 'detail', id],
    queryFn: () => fetchVolunteer(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}