'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronLeft } from 'lucide-react';
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
  /** Rota fixa para onde o botão "Voltar" deve navegar (ex: '/comunidade'). */
  backHref?: string;
  /** Handler customizado para o "Voltar" (ex: router.back()). Tem prioridade sobre backHref. */
  onBack?: () => void;
};

export default function Header({
  title,
  description,
  actions = [],
  titleAdornment,
  actionsAdornment,
  backHref,
  onBack,
}: HeaderProps) {
  const router = useRouter();
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

  const showBack = Boolean(onBack || backHref);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (backHref) {
      router.push(backHref);
    }
  };

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
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Voltar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#701513] text-white transition hover:bg-[#701513]/90 active:bg-[#701513]/40"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <h1 className="m-0 text-[32px] font-semibold tracking-wide text-black">{title}</h1>
              {titleAdornment}
            </div>
          </div>
          {description && (
            <p className="m-0 text-sm tracking-wide text-[#00000096] ps-0">{description}</p>
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