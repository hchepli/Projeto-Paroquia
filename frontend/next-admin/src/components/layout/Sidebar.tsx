// src/components/layout/Sidebar.tsx
// Sidebar genérica: não conhece paróquia, rotas nem cargos. Tudo entra por props.
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image, { type StaticImageData } from 'next/image';
import NavLink, { type NavItem } from '@/components/ui/nav/NavLink';
import CollapseButton from '@/components/ui/buttons/CollapseButton';
import LogoutButton from '@/components/ui/buttons/LogoutButton';

export type NavSection = {
  /** Título do grupo (ex: "Comunicação"). Sem label = grupo sem título. */
  label?: string;
  items: NavItem[];
};

export type SidebarBrand = {
  /** Aceita "\n" para quebrar linha. */
  name: string;
  logo: StaticImageData | string;
  logoAlt?: string;
};

export type SidebarProps = {
  brand: SidebarBrand;
  /** Grupos do topo (menu principal). */
  sections: NavSection[];
  /** Grupos do rodapé (ex: "Geral" → Configurações). */
  footerSections?: NavSection[];
  /** Se informado, mostra o botão de sair no rodapé. */
  onLogout?: () => void;
  logoutLabel?: string;
  defaultCollapsed?: boolean;
  /** Chave do localStorage para lembrar o estado recolhido. null/undefined = não persiste. */
  storageKey?: string | null;
};

const WIDTH_EXPANDED = 288;
const WIDTH_COLLAPSED = 90;

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SectionBlock({
  section,
  pathname,
  collapsed,
}: {
  section: NavSection;
  pathname: string | null;
  collapsed: boolean;
}) {
  return (
    <>
      {section.label &&
        (collapsed ? (
          <div className="mx-2 mb-3 mt-2 h-px bg-[#ECEAE6]" />
        ) : (
          <span className="px-3 py-2 text-xs font-light tracking-wide text-[#8A8A86]">{section.label}</span>
        ))}
      {section.items.map((item) => (
        <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} />
      ))}
    </>
  );
}

export default function Sidebar({
  brand,
  sections,
  footerSections = [],
  onLogout,
  logoutLabel,
  defaultCollapsed = false,
  storageKey = null,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const pathname = usePathname();

  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) setCollapsed(stored === '1');
    } catch {
      /* localStorage indisponível: segue com o padrão */
    }
  }, [storageKey]);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, next ? '1' : '0');
        } catch {
          /* ignora */
        }
      }
      return next;
    });
  }

  return (
    <aside
      className="sticky top-0 flex h-screen shrink-0 flex-col border-r border-[#ECEAE6] bg-white transition-[width] duration-150 ease-in-out"
      style={{ width: collapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED }}
    >
      <div className="relative px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <Image src={brand.logo} alt={brand.logoAlt ?? brand.name} width={72} height={72} />
          {!collapsed && (
            <span className="whitespace-pre-line text-[16px] font-semibold leading-tight text-[#1C1C1A]">
              {brand.name}
            </span>
          )}
        </div>

        <CollapseButton collapsed={collapsed} onClick={toggle} />
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-2">
        {sections.map((section, index) => (
          <SectionBlock key={section.label ?? index} section={section} pathname={pathname} collapsed={collapsed} />
        ))}
      </nav>

      <nav className="flex flex-col px-3 pb-6 pt-3">
        {footerSections.map((section, index) => (
          <SectionBlock key={section.label ?? index} section={section} pathname={pathname} collapsed={collapsed} />
        ))}
        {onLogout && <LogoutButton onClick={onLogout} collapsed={collapsed} label={logoutLabel} />}
      </nav>
    </aside>
  );
}
