// src/hooks/users/useUser.ts
import { useQuery } from '@tanstack/react-query';
import { User } from '@/types/users/user';
import { parseApiError } from '@/lib/api-error';

async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${encodeURIComponent(id)}`);
  if (!res.ok) throw await parseApiError(res, 'Erro ao buscar usuário.');
  return res.json();
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });
}