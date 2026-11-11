// src/hooks/auth/useCurrentUser.ts
// Uma única busca de /api/auth/me para o app todo (cache do React Query).
// Devolve o formato cru da API (role, pastoralGroup) + campos extras (roleName, roleKey),
// para as páginas antigas e os componentes novos de layout funcionarem juntos.
'use client';

import { useQuery } from '@tanstack/react-query';
import { API_ROUTES } from '@/config/routes';
import { resolveRoleKey, type RoleKey } from '@/config/roles';

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  roleId: number | null;
  pastoralGroupId: number | null;
  status?: string;
  role: { id: number; name: string } | null;
  pastoralGroup: { id: number; name: string } | null;
  // Campos extras (layout novo)
  roleName: string | null;
  roleKey: RoleKey | null;
};

async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const res = await fetch(API_ROUTES.me);
  if (res.status === 401) return null; // sessão inválida: o middleware cuida do redirecionamento
  if (!res.ok) throw new Error('Serviço indisponível.');

  const data = await res.json();
  const roleName: string | null = data?.role?.name ?? null;

  return {
    id: data?.id,
    name: data?.name ?? 'Usuário',
    email: data?.email ?? '',
    roleId: data?.roleId ?? null,
    pastoralGroupId: data?.pastoralGroupId ?? null,
    status: data?.status,
    role: data?.role ?? null,
    pastoralGroup: data?.pastoralGroup ?? null,
    roleName,
    roleKey: resolveRoleKey(roleName),
  };
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}