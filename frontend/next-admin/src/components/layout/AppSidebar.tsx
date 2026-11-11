// src/components/layout/AppSidebar.tsx
// Montagem ESPECÍFICA da paróquia: marca + menu filtrado pelo cargo + logout.
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
import { BRAND } from '@/config/brand';
import { getNavigation } from '@/config/navigation';
import { API_ROUTES, ROUTES } from '@/config/routes';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';

export default function AppSidebar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  const roleKey = user?.roleKey ?? null;
  const { main, footer } = useMemo(() => getNavigation(roleKey), [roleKey]);

  async function handleLogout() {
    await fetch(API_ROUTES.logout, { method: 'POST' });
    queryClient.clear();
    router.push(ROUTES.login);
    router.refresh();
  }

  return (
    <Sidebar
      brand={BRAND}
      sections={main}
      footerSections={footer}
      onLogout={handleLogout}
      logoutLabel="Sair"
      storageKey="admin:sidebar-collapsed"
    />
  );
}
