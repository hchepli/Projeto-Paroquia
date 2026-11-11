// src/components/ui/buttons/LogoutButton.tsx
'use client';

import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  onClick: () => void;
  collapsed: boolean;
  label?: string;
}

export default function LogoutButton({ onClick, collapsed, label = 'Sair' }: LogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={`flex w-full items-center gap-3 rounded-lg border-none bg-transparent px-3 py-2.5 text-left text-sm font-medium text-[#701513] cursor-pointer ${
        collapsed ? 'justify-center' : 'justify-start'
      }`}
    >
      <LogOut size={18} />
      {!collapsed && <span>{label}</span>}
    </button>
  );
}
