import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Role, RoleInput } from '@/types/roles/role';
import { parseApiError } from '@/lib/api-error';

export function useRoles(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['roles'],
    enabled: options.enabled ?? true,
    queryFn: async (): Promise<Role[]> => {
      const res = await fetch('/api/roles');
      if (!res.ok) throw await parseApiError(res, 'Erro ao buscar funções.');
      return res.json();
    },
  });
}

export function useSaveRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: RoleInput }): Promise<Role> => {
      const res = await fetch(id ? `/api/roles/${id}` : '/api/roles', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw await parseApiError(res, 'Erro ao salvar função.');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, confirmBase }: { id: number; confirmBase: boolean }) => {
      const res = await fetch(`/api/roles/${id}${confirmBase ? '?confirmBase=true' : ''}`, { method: 'DELETE' });
      if (!res.ok) throw await parseApiError(res, 'Erro ao apagar função.');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
}