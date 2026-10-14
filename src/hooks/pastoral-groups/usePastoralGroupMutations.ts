// src/hooks/pastoral-groups/usePastoralGroupMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PastoralGroup } from '@/types/pastoral-groups/pastoral-group';
import { PastoralGroupInput } from '@/types/pastoral-groups/pastoral-group-input';
import { parseApiError } from '@/lib/api-error';

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['pastoral-groups'] });
}

export function useCreatePastoralGroup() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: PastoralGroupInput): Promise<PastoralGroup> => {
      const res = await fetch('/api/pastoral-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw await parseApiError(res, 'Erro ao cadastrar pastoral.');
      return res.json();
    },
    onSuccess: invalidate,
  });
}

export function useUpdatePastoralGroup(id: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: PastoralGroupInput): Promise<PastoralGroup> => {
      const res = await fetch(`/api/pastoral-groups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw await parseApiError(res, 'Erro ao atualizar pastoral.');
      return res.json();
    },
    onSuccess: invalidate,
  });
}

export function useDeletePastoralGroup() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/pastoral-groups/${id}`, { method: 'DELETE' });
      if (!res.ok) throw await parseApiError(res, 'Erro ao remover pastoral.');
      return res.json();
    },
    onSuccess: invalidate,
  });
}