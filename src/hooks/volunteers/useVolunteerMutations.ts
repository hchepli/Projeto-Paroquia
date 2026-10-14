// src/hooks/volunteers/useVolunteerMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UpdateVolunteerInput } from '@/types/volunteers/update-volunteer';
import { Volunteer } from '@/types/volunteers/volunteer';
import { parseApiError } from '@/lib/api-error';

export function useUpdateVolunteer(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateVolunteerInput): Promise<Volunteer> => {
      const res = await fetch(`/api/volunteers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw await parseApiError(res, 'Erro ao atualizar voluntário.');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['volunteers'] }),
  });
}

export function useDeleteVolunteer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, confirm }: { id: number; confirm?: boolean }) => {
      const res = await fetch(`/api/volunteers/${id}${confirm ? '?confirm=true' : ''}`, { method: 'DELETE' });
      if (!res.ok) throw await parseApiError(res, 'Erro ao remover voluntário.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] }); // atribuições removidas em cascata
    },
  });
}