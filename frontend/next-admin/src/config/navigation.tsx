// src/config/navigation.tsx
// Menu da paróquia × cargo (tabela aprovada na Fase 0). Específico do projeto, fora dos componentes.
import type { ReactNode } from 'react';
import {
  Calendar,
  CalendarDays,
  Church,
  ClipboardList,
  Cross,
  HeartHandshake,
  Images,
  LayoutGrid,
  LucideIcon,
  Megaphone,
  Settings,
  Users,
} from 'lucide-react';
import type { NavItem } from '@/components/ui/nav/NavLink';
import type { NavSection } from '@/components/layout/Sidebar';
import { ROUTES } from './routes';
import type { RoleKey } from './roles';

type ConfigItem = { label: string; href: string; icon: ReactNode; roles: RoleKey[] };
type ConfigSection = { label?: string; items: ConfigItem[] };

const icon = (Icon: LucideIcon) => <Icon size={18} strokeWidth={1.8} />;

const ADMIN: RoleKey[] = ['ADMIN_GERAL'];
const ADMIN_SEC: RoleKey[] = ['ADMIN_GERAL', 'SECRETARIA'];
const ALL: RoleKey[] = ['ADMIN_GERAL', 'SECRETARIA', 'COORDENADOR_PASTORAL'];

const MAIN: ConfigSection[] = [
  {
    label: 'Início',
    items: [{ label: 'Início', href: ROUTES.inicio, icon: icon(LayoutGrid), roles: ALL }],
  },
  {
    label: 'Dia a dia da paróquia',
    items: [
      { label: 'Calendário', href: ROUTES.calendario, icon: icon(Calendar), roles: ALL },
      { label: 'Missas', href: ROUTES.missas, icon: icon(Church), roles: ALL },
      { label: 'Escalas', href: ROUTES.escalas, icon: icon(ClipboardList), roles: ALL },
      { label: 'Eventos', href: ROUTES.eventos, icon: icon(CalendarDays), roles: ALL },
      { label: 'Sacramentos', href: ROUTES.sacramentos, icon: icon(Cross), roles: ADMIN_SEC },
    ],
  },
  {
    label: 'Comunicação',
    items: [
      { label: 'Avisos', href: ROUTES.avisos, icon: icon(Megaphone), roles: ADMIN_SEC },
      { label: 'Álbuns', href: ROUTES.albuns, icon: icon(Images), roles: ADMIN_SEC },
    ],
  },
  {
    label: 'Administração',
    items: [
      // As abas dentro de /pessoas (Usuários / Voluntários) são filtradas pela própria página.
      { label: 'Pessoas', href: ROUTES.pessoas, icon: icon(Users), roles: ALL },
      { label: 'Pastorais', href: ROUTES.pastorais, icon: icon(HeartHandshake), roles: ALL },
    ],
  },
];

const FOOTER: ConfigSection[] = [
  {
    label: 'Geral',
    items: [{ label: 'Configurações', href: ROUTES.configuracoes, icon: icon(Settings), roles: ADMIN }],
  },
];

function filterByRole(sections: ConfigSection[], role: RoleKey | null): NavSection[] {
  if (!role) return [];
  return sections
    .map((section) => ({
      label: section.label,
      items: section.items
        .filter((item) => item.roles.includes(role))
        .map((item): NavItem => ({ label: item.label, href: item.href, icon: item.icon })),
    }))
    .filter((section) => section.items.length > 0);
}

export function getNavigation(role: RoleKey | null) {
  return { main: filterByRole(MAIN, role), footer: filterByRole(FOOTER, role) };
}
