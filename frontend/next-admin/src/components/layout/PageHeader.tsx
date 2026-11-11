// src/components/layout/PageHeader.tsx
// Cabeçalho da página: título, descrição, "Voltar" e botões de ação.
'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import ActionButton, { HeaderAction } from '@/components/ui/buttons/ActionButton';

export type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: HeaderAction[];
  titleAdornment?: ReactNode;
  actionsAdornment?: ReactNode;
  /** Rota fixa para onde o botão "Voltar" navega (ex: '/eventos'). */
  backHref?: string;
  /** Handler customizado para o "Voltar". Tem prioridade sobre backHref. */
  onBack?: () => void;
  /** Texto do botão voltar para leitores de tela. */
  backLabel?: string;
};

export default function PageHeader({
  title,
  description,
  actions = [],
  titleAdornment,
  actionsAdornment,
  backHref,
  onBack,
  backLabel = 'Voltar',
}: PageHeaderProps) {
  const router = useRouter();
  const showBack = Boolean(onBack || backHref);

  const handleBack = () => {
    if (onBack) return onBack();
    if (backHref) router.push(backHref);
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              aria-label={backLabel}
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
        {description && <p className="m-0 text-sm tracking-wide text-[#00000096] ps-0">{description}</p>}
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
  );
}
