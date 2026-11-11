// src/components/layout/Header.tsx
// Mantém a MESMA API de antes (as 27 páginas não mudam) e agora compõe Topbar + PageHeader.
// Novos props opcionais: search e notifications (prontos para "funcionar" quando houver dado).
'use client';

import type { HeaderAction } from '@/components/ui/buttons/ActionButton';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import PageHeader, { type PageHeaderProps } from './PageHeader';
import Topbar, { type TopbarProps } from './Topbar';

export type { HeaderAction };

export type HeaderProps = PageHeaderProps & Pick<TopbarProps, 'search' | 'notifications'>;

export default function Header({ search, notifications, ...pageHeaderProps }: HeaderProps) {
  const { data: user, isLoading } = useCurrentUser();

  return (
    <>
      <Topbar user={user} userLoading={isLoading} search={search} notifications={notifications} />
      <PageHeader {...pageHeaderProps} />
    </>
  );
}
