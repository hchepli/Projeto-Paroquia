// src/components/layout/Topbar.tsx
// Barra superior: busca + notificações + usuário. Sem fetch: tudo por props.
'use client';

import { Bell } from 'lucide-react';
import SearchInput from '@/components/ui/inputs/SearchInput';
import IconButton from '@/components/ui/buttons/IconButton';
import UserMenu from '@/components/ui/layout/UserMenu';

export type TopbarUser = { name?: string; email?: string };

export type TopbarSearch = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** Padrão: desabilitada enquanto não houver onChange. */
  disabled?: boolean;
};

export type TopbarNotifications = {
  /** Bolinha de aviso só aparece com count > 0. */
  count?: number;
  onClick?: () => void;
  ariaLabel?: string;
};

export type TopbarProps = {
  user?: TopbarUser | null;
  userLoading?: boolean;
  search?: TopbarSearch;
  notifications?: TopbarNotifications;
};

export default function Topbar({ user, userLoading = false, search, notifications }: TopbarProps) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white py-8">
      <SearchInput
        placeholder={search?.placeholder}
        value={search?.value}
        onChange={search?.onChange}
        disabled={search?.disabled ?? !search?.onChange}
      />

      <div className="flex shrink-0 items-center gap-5">
        <IconButton
          icon={<Bell size={20} />}
          ariaLabel={notifications?.ariaLabel ?? 'Notificações'}
          onClick={notifications?.onClick}
          showBadge={(notifications?.count ?? 0) > 0}
        />

        <div className="h-8 w-px bg-[#ECEAE6]" />

        <UserMenu name={user?.name ?? 'Usuário'} email={user?.email ?? ''} loading={userLoading} />
      </div>
    </div>
  );
}
