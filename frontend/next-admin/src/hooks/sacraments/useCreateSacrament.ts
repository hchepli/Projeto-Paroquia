// src/hooks/sacraments/useCreateSacrament.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sacramentsFetch } from '@/lib/sacraments/api';
import { Sacrament, SacramentPayload } from '@/types/sacraments/sacraments';
import { SACRAMENTS_KEY } from './useSacraments';

export function useCreateSacrament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SacramentPayload) =>
      sacramentsFetch<Sacrament>('/api/sacraments', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SACRAMENTS_KEY }),
  });
}
