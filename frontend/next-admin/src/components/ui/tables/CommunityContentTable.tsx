'use client';

import { Search, FolderOpen, Newspaper, CalendarDays, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export type CommunityContentType = 'ALBUM' | 'ANNOUNCEMENT' | 'EVENT';
type TypeFilter = 'ALL' | CommunityContentType;

export interface CommunityContentItem {
  id: string; // prefixado por tipo pra evitar colisão de id numérico entre entidades (ex: "album-3")
  type: CommunityContentType;
  title: string;
  date: string; // ISO — createdAt (Álbum/Comunicado) ou startDate (Evento)
  statusLabel?: string; // ex: "Publicado", "Oculto", "Ativo", "Cancelado"
  href: string; // pra onde "Ver" navega — página dedicada da entidade
}

interface CommunityContentTableProps {
  items: CommunityContentItem[];
  isLoading?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (value: TypeFilter) => void;
}

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'ALBUM', label: 'Álbuns' },
  { value: 'ANNOUNCEMENT', label: 'Comunicados' },
  { value: 'EVENT', label: 'Eventos' },
];

const TYPE_META: Record<CommunityContentType, { label: string; icon: typeof FolderOpen }> = {
  ALBUM: { label: 'Álbum', icon: FolderOpen },
  ANNOUNCEMENT: { label: 'Comunicado', icon: Newspaper },
  EVENT: { label: 'Evento', icon: CalendarDays },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function CommunityContentTable({
  items,
  isLoading,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
}: CommunityContentTableProps) {
  const router = useRouter();

  return (
    <div className="w-full rounded-[16px] border border-[rgba(0,0,0,0.3)] p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar em álbuns, comunicados e eventos..."
            className="w-full rounded-lg border border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.02)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#701513]"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value as TypeFilter)}
          className="rounded-lg border border-[rgba(0,0,0,0.1)] px-3 py-2 text-sm outline-none focus:border-[#701513]"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-sm text-[rgba(0,0,0,0.5)]">
              <th className="py-2 pr-4 font-normal">Data</th>
              <th className="py-2 pr-4 font-normal">Título</th>
              <th className="py-2 pr-4 font-normal">Tipo</th>
              <th className="py-2 pr-4 font-normal">Status</th>
              <th className="py-2 text-center font-normal">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-[rgba(0,0,0,0.4)]">
                  Carregando...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-[rgba(0,0,0,0.4)]">
                  Nenhum item encontrado.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const meta = TYPE_META[item.type];
                const Icon = meta.icon;
                return (
                  <tr key={item.id} className="border-t border-[rgba(0,0,0,0.08)] text-sm">
                    <td className="py-3 pr-4 text-[rgba(0,0,0,0.7)]">{formatDate(item.date)}</td>
                    <td className="py-3 pr-4 text-[rgba(0,0,0,0.7)]">{item.title}</td>
                    <td className="py-3 pr-4">
                      <span className="flex w-fit items-center gap-1 rounded-full bg-[rgba(0,0,0,0.05)] px-2 py-1 text-xs font-medium text-[rgba(0,0,0,0.7)]">
                        <Icon size={12} /> {meta.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[rgba(0,0,0,0.7)]">{item.statusLabel ?? '—'}</td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => router.push(item.href)}
                        className="flex items-center gap-1 rounded-full bg-[rgba(0,0,0,0.05)] px-3 py-1.5 text-xs font-medium text-[rgba(0,0,0,0.7)] hover:bg-[rgba(0,0,0,0.1)]"
                      >
                        Ver <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
