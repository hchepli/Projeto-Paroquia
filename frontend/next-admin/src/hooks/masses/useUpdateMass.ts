// src/hooks/masses/useUpdateMass.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Mass, UpdateMassInput } from '@/types/masses/masses';
import { throwApiError } from '@/lib/errors';

interface UpdateMassPayload {
  id: number;
  data: UpdateMassInput;
}

async function updateMass({ id, data }: UpdateMassPayload): Promise<Mass> {
  const res = await fetch(`/api/masses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) await throwApiError(res, 'Erro ao atualizar missa.');
  return res.json();
}

export function useUpdateMass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMass,
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['mass', id] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['masses'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}
