// src/components/ui/buttons/ActionButton.tsx
'use client';

import { useRef, useState } from 'react';
import { LucideIcon, Plus } from 'lucide-react';

export interface HeaderAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary';
  icon?: LucideIcon; // opcional, default Plus (mantém comportamento atual)
  iconPosition?: 'left' | 'right'; // default 'left', igual já era
}

interface ActionButtonProps {
  action: HeaderAction;
}

export default function ActionButton({ action }: ActionButtonProps) {
  const [phase, setPhase] = useState<'idle' | 'entering' | 'leaving'>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const Icon = action.icon ?? Plus;
  const iconPosition = action.iconPosition ?? 'left';

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

  const baseClasses =
    'group relative overflow-hidden flex items-center gap-4 rounded-md pl-3 pr-4 py-3 text-sm font-medium cursor-pointer border border-[#00000070] bg-white text-[#000000d2]';

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
    <button onClick={action.onClick} className={baseClasses} {...sharedProps}>
      {fill}
      {content}
    </button>
  );
}