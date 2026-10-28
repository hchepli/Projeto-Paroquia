// src/hooks/sacraments/useUpdateSacrament.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sacramentsFetch } from '@/lib/sacraments/api';
import { Sacrament, UpdateSacramentInput } from '@/types/sacraments/sacraments';
import { SACRAMENTS_KEY } from './useSacraments';

export function useUpdateSacrament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateSacramentInput) =>
      sacramentsFetch<Sacrament>(`/api/sacraments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SACRAMENTS_KEY }),
  });
}
