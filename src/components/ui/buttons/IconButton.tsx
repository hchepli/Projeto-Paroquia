'use client';

import { ReactNode } from 'react';

interface IconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  showBadge?: boolean;
}

export default function IconButton({ icon, onClick, ariaLabel, showBadge }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-none bg-[#F4F3F1] text-[#4A4A47]"
    >
      {icon}
      {showBadge && (
        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full border-[1.5px] border-white bg-[#701513]" />
      )}
    </button>
  );
}