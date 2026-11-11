// src/components/ui/buttons/ActionButton.tsx
'use client';

import { useRef, useState } from 'react';
import { ChevronRight, ChevronDown, LucideIcon, Plus } from 'lucide-react';

export type ActionKind = 'create' | 'menu' | 'navigate';

export interface HeaderAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary';
  /** create = "+" à esquerda | menu = seta para baixo à direita | navigate = seta de link à direita. Padrão: create. */
  kind?: ActionKind;
  /** Sobrescreve o ícone do `kind`. */
  icon?: LucideIcon;
  /** Sobrescreve a posição do `kind`. */
  iconPosition?: 'left' | 'right';
}

const KIND_CONFIG: Record<ActionKind, { icon: LucideIcon; position: 'left' | 'right' }> = {
  create: { icon: Plus, position: 'left' },
  menu: { icon: ChevronDown, position: 'right' },
  navigate: { icon: ChevronRight, position: 'right' },
};

interface ActionButtonProps {
  action: HeaderAction;
}

export default function ActionButton({ action }: ActionButtonProps) {
  const [phase, setPhase] = useState<'idle' | 'entering' | 'leaving'>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = KIND_CONFIG[action.kind ?? 'create'];
  const Icon = action.icon ?? config.icon;
  const iconPosition = action.iconPosition ?? config.position;

  function handleEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPhase('entering');
  }

  function handleLeave() {
    setPhase('leaving');
  }

  function handleFillTransitionEnd() {
    if (phase === 'leaving') {
      timeoutRef.current = setTimeout(() => setPhase('idle'), 0);
    }
  }

  const fillTranslate =
    phase === 'entering' ? 'translate-x-0' : phase === 'leaving' ? 'translate-x-full' : '-translate-x-full';

  const isFilled = phase === 'entering';

  // Ícone à direita: mais espaço à esquerda e menos à direita, para o ícone ficar no canto.
  const paddingClasses = iconPosition === 'right' ? 'pl-4 pr-3' : 'pl-3 pr-4';

  const baseClasses = `group relative overflow-hidden flex items-center gap-4 rounded-md ${paddingClasses} py-3 text-sm font-medium cursor-pointer border border-[#00000070] bg-white text-[#000000d2]`;

  const fill = (
    <span
      aria-hidden
      onTransitionEnd={handleFillTransitionEnd}
      className={`absolute inset-0 bg-[#701513] transition-transform duration-300 ease-in-out ${
        phase === 'idle' ? 'transition-none' : ''
      } ${fillTranslate}`}
    />
  );

  const iconEl = (
    <Icon
      size={24}
      aria-hidden="true"
      className={`relative z-10 transition-colors duration-300 ease-in-out ${isFilled ? 'text-white' : ''}`}
    />
  );

  const labelEl = (
    <span className={`relative z-10 transition-colors duration-300 ease-in-out ${isFilled ? 'text-white' : ''}`}>
      {action.label}
    </span>
  );

  const content =
    iconPosition === 'right' ? (
      <>
        {labelEl}
        {iconEl}
      </>
    ) : (
      <>
        {iconEl}
        {labelEl}
      </>
    );

  const sharedProps = {
    onMouseEnter: handleEnter,
    onMouseLeave: handleLeave,
  };

  if (action.href) {
    return (
      <a href={action.href} className={`${baseClasses} no-underline`} {...sharedProps}>
        {fill}
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={baseClasses} {...sharedProps}>
      {fill}
      {content}
    </button>
  );
}