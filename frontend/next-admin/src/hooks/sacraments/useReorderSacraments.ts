// src/hooks/sacraments/useReorderSacraments.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sacramentsFetch } from '@/lib/sacraments/api';
import { Sacrament } from '@/types/sacraments/sacraments';
import { SACRAMENTS_KEY } from './useSacraments';

// Envia TODOS os ids na nova ordem; o back devolve a lista já reordenada.
export function useReorderSacraments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) =>
      sacramentsFetch<Sacrament[]>('/api/sacraments/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: (list) => {
      qc.setQueryData(SACRAMENTS_KEY, list);
      qc.invalidateQueries({ queryKey: SACRAMENTS_KEY });
    },
  });
}
