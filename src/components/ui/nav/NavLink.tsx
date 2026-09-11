'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

export type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

interface NavLinkProps {
  item: NavItem;
  active?: boolean;
  collapsed: boolean;
}

export default function NavLink({ item, active, collapsed }: NavLinkProps) {
  return (
    <Link
      href={item.href}
      className={`group relative mb-1 flex items-center gap-3 rounded-xl px-3.5 py-4 text-sm no-underline border-l-[3px] ${
        collapsed ? 'justify-center' : 'justify-start'
      } ${
        active
          ? 'bg-white font-semibold text-black shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-l-[#701513]'
          : 'bg-transparent font-normal text-[#4A4A47] border-l-transparent'
      }`}
    >
      <span
        className={`flex shrink-0 transition-colors duration-150 ${
          active ? 'text-[#701513]' : 'text-[#8A8A86] group-hover:text-[#701513]'
        }`}
      >
        {item.icon}
      </span>
      {!collapsed && (
        <span
          className={`transition-colors duration-150 ${
            active ? 'text-black' : 'text-[#4A4A47] group-hover:text-black'
          }`}
        >
          {item.label}
        </span>
      )}
    </Link>
  );
}