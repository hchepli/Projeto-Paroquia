// src/hooks/sacraments/useSacrament.ts
import { useQuery } from '@tanstack/react-query';
import { sacramentsFetch } from '@/lib/sacraments/api';
import { Sacrament } from '@/types/sacraments/sacraments';
import { SACRAMENTS_KEY } from './useSacraments';

export function useSacrament(id: number) {
  return useQuery({
    queryKey: [...SACRAMENTS_KEY, id],
    queryFn: () => sacramentsFetch<Sacrament>(`/api/sacraments/${id}`),
    enabled: Number.isInteger(id) && id > 0,
  });
}
