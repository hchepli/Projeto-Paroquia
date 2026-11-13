// src/hooks/users/useUserMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/types/users/user';
import { CreateUserInput } from '@/types/users/create-user';
import { UpdateUserInput } from '@/types/users/update-user';
import { parseApiError } from '@/lib/api-error';

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateUserInput): Promise<User> => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw await parseApiError(res, 'Erro ao cadastrar usuário.');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

/** Também serve para Desativar/Reativar (UC003): `mutate({ status: 'INATIVO' })`. */
export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateUserInput): Promise<User> => {
      const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw await parseApiError(res, 'Erro ao atualizar usuário.');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}