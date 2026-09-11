'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import SearchInput from '@/components/ui/inputs/SearchInput';
import IconButton from '@/components/ui/buttons/IconButton';
import ActionButton, { HeaderAction } from '@/components/ui/buttons/ActionButton';
import UserMenu from '@/components/ui/layout/UserMenu';

export type { HeaderAction };

type CurrentUser = {
  name: string;
  email: string;
};

type HeaderProps = {
  title: string;
  description?: string;
  actions?: HeaderAction[];
  titleAdornment?: ReactNode;
  actionsAdornment?: ReactNode;
};

export default function Header({
  title,
  description,
  actions = [],
  titleAdornment,
  actionsAdornment,
}: HeaderProps) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) setUser(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <div className="flex items-center justify-between gap-3 bg-white py-8">
        <SearchInput />

        <div className="flex shrink-0 items-center gap-5">
          <IconButton icon={<Bell size={20} />} ariaLabel="Notificações" showBadge />

          <div className="h-8 w-px bg-[#ECEAE6]" />

          <UserMenu name={user?.name ?? 'Usuário'} email={user?.email ?? ''} loading={loading} />
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="m-0 text-[32px] font-semibold tracking-wide text-black">{title}</h1>
            {titleAdornment}
          </div>
          {description && (
            <p className="m-0 text-sm tracking-wide text-[#00000096]">{description}</p>
          )}
        </div>

        {(actions.length > 0 || actionsAdornment) && (
          <div className="flex shrink-0 items-center gap-3">
            {actions.map((action) => (
              <ActionButton key={action.label} action={action} />
            ))}
            {actionsAdornment}
          </div>
        )}
      </div>
    </>
  );
}