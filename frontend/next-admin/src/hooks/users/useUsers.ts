// src/hooks/users/useUsers.ts
import { useQuery } from '@tanstack/react-query';
import { User } from '@/types/users/user';
import { parseApiError } from '@/lib/api-error';

async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users');
  if (!res.ok) throw await parseApiError(res, 'Erro ao buscar usuários.');
  return res.json();
}

/** `enabled: false` evita a busca para cargos que não veem Usuários. */
export function useUsers(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: options.enabled ?? true,
  });
}