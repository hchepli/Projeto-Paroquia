// src/hooks/auth/useCurrentUser.ts
import { useQuery } from '@tanstack/react-query';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  roleId: number;
  pastoralGroupId: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  role: { id: number; name: string };
  pastoralGroup: { id: number; name: string } | null;
}

async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const res = await fetch('/api/auth/me');
  if (!res.ok) return null;
  return res.json();
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
}