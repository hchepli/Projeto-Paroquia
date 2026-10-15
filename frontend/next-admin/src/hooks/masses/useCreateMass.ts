// src/hooks/masses/useCreateMass.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateMassInput, Mass } from '@/types/masses/masses';
import { throwApiError } from '@/lib/errors';

async function createMass(input: CreateMassInput): Promise<Mass> {
  const res = await fetch('/api/masses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) await throwApiError(res, 'Erro ao criar missa.');
  return res.json();
}

export function useCreateMass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['masses'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}
