// src/hooks/sacraments/useSacraments.ts
import { useQuery } from '@tanstack/react-query';
import { sacramentsFetch } from '@/lib/sacraments/api';
import { Sacrament } from '@/types/sacraments/sacraments';

export const SACRAMENTS_KEY = ['sacraments'] as const;

// Lista completa (poucos itens, sem paginação), já ordenada por displayOrder no back.
export function useSacraments() {
  return useQuery({
    queryKey: SACRAMENTS_KEY,
    queryFn: () => sacramentsFetch<Sacrament[]>('/api/sacraments'),
  });
}
