'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { LayoutGrid, Coins, Calendar, Users, User, Settings } from 'lucide-react';
import logoIgreja from '@/assets/img/logo/logo-igreja.svg';
import NavLink, { NavItem } from '@/components/ui/nav/NavLink';
import CollapseButton from '@/components/ui/buttons/CollapseButton';
import LogoutButton from '@/components/ui/buttons/LogoutButton';

const overviewItems: NavItem[] = [
  { label: 'Painel Admin', href: '/painel', icon: <LayoutGrid size={18} strokeWidth={1.8} /> },
  //{ label: 'Finanças', href: '/financas', icon: <Coins size={18} strokeWidth={1.8} /> },
  { label: 'Calendário', href: '/calendario', icon: <Calendar size={18} strokeWidth={1.8} /> },
  { label: 'Comunidade', href: '/comunidade', icon: <Users size={18} strokeWidth={1.8} /> },
  { label: 'Escalas', href: '/escalas', icon: <User size={18} strokeWidth={1.8} /> },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside
      className="sticky top-0 flex h-screen shrink-0 flex-col border-r border-[#ECEAE6] bg-white transition-[width] duration-150 ease-in-out"
      style={{ width: collapsed ? 90 : 288 }}
    >
      <div className="relative px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <Image src={logoIgreja} alt="Igreja Logo" width={72} height={72} />
          {!collapsed && (
            <span className="text-[16px] font-semibold leading-tight text-[#1C1C1A]">
              Paroquia Divino
              <br />
              Espírito Santo
            </span>
          )}
        </div>

        <CollapseButton collapsed={collapsed} onClick={() => setCollapsed((v) => !v)} />
      </div>
      <nav className="flex flex-col px-3 py-2">
        {collapsed ? (
          <div className="mx-2 mb-3 mt-2 h-px bg-[#ECEAE6]" />
        ) : (
          <span className="px-3 py-2 text-xs font-light tracking-wide text-[#8A8A86]">Overview</span>
        )}
        {overviewItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname?.startsWith(item.href)}
            collapsed={collapsed}
          />
        ))}
      </nav>
      <div className="flex-1" />
      <nav className="flex flex-col px-3 pb-6 pt-3">
        {collapsed ? (
          <div className="mx-2 mb-3 mt-2 h-px bg-[#ECEAE6]" />
        ) : (
          <span className="px-3 py-2 text-xs font-light tracking-wide text-[#8A8A86]">General</span>
        )}
        <NavLink
          item={{ label: 'Configurações', href: '/configuracoes', icon: <Settings size={18} strokeWidth={1.8} /> }}
          active={pathname?.startsWith('/configuracoes')}
          collapsed={collapsed}
        />
        <LogoutButton onClick={handleLogout} collapsed={collapsed} />
      </nav>
    </aside>
  );
}