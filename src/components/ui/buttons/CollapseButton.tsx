'use client';

import { ChevronLeft } from 'lucide-react';

interface CollapseButtonProps {
  collapsed: boolean;
  onClick: () => void;
}

export default function CollapseButton({ collapsed, onClick }: CollapseButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      className="absolute top-7 -right-3.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#701513] text-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] cursor-pointer"
    >
      <ChevronLeft
        size={14}
        strokeWidth={2.5}
        className={`transition-transform duration-150 ${collapsed ? 'rotate-180' : ''}`}
      />
    </button>
  );
}