// src/hooks/sacraments/useDeleteSacrament.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sacramentsFetch } from '@/lib/sacraments/api';
import { SACRAMENTS_KEY } from './useSacraments';

export function useDeleteSacrament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => sacramentsFetch<unknown>(`/api/sacraments/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SACRAMENTS_KEY }),
  });
}
