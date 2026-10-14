'use client';

import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  onClick: () => void;
  collapsed: boolean;
}

export default function LogoutButton({ onClick, collapsed }: LogoutButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border-none bg-transparent px-3 py-2.5 text-left text-sm font-medium text-[#701513] cursor-pointer ${
        collapsed ? 'justify-center' : 'justify-start'
      }`}
    >
      <LogOut size={18} />
      {!collapsed && <span>Logout</span>}
    </button>
  );
}