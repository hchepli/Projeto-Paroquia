'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, EyeOff, Eye, Search, ArrowRight } from 'lucide-react';
import { Announcement, AnnouncementStatus } from '@/types/announcements/announcement';

type StatusFilter = 'ALL' | AnnouncementStatus;

interface AnnouncementsTableProps {
  items: Announcement[];
  isLoading?: boolean;
  categoryNameById?: Record<number, string>;
  onEdit?: (announcement: Announcement) => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  onViewAll?: () => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PUBLISHED', label: 'Publicados' },
  { value: 'DRAFT', label: 'Ocultos' },
];

export default function AnnouncementsTable({
  items,
  isLoading,
  categoryNameById = {},
  onEdit,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onViewAll,
}: AnnouncementsTableProps) {
  const queryClient = useQueryClient();
  const [togglingId, setTogglingId] = useState<number | null>(null);

  async function handleToggleStatus(announcement: Announcement) {
    const nextStatus = announcement.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    setTogglingId(announcement.id);
    try {
      const res = await fetch(`/api/announcements/${announcement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar status.');
      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
    } catch {
      // Erro silencioso por ora — sem componente de toast definido ainda.
    } finally {
      setTogglingId(null);
    }
  }

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
            placeholder="Buscar aviso..."
            className="w-full rounded-lg border border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.02)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#701513]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
          className="rounded-lg border border-[rgba(0,0,0,0.1)] px-3 py-2 text-sm outline-none focus:border-[#701513]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={onViewAll}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-[rgba(0,0,0,0.1)] px-3 py-2 text-sm font-medium text-[rgba(0,0,0,0.7)] hover:bg-gray-50"
        >
          Ver Todas <ArrowRight size={14} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-sm text-[rgba(0,0,0,0.5)]">
              <th className="py-2 pr-4 font-normal">Data</th>
              <th className="py-2 pr-4 font-normal">Aviso</th>
              <th className="py-2 pr-4 font-normal">Tipo</th>
              <th className="py-2 text-center font-normal">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-sm text-[rgba(0,0,0,0.4)]">
                  Carregando...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-sm text-[rgba(0,0,0,0.4)]">
                  Nenhum comunicado encontrado.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-[rgba(0,0,0,0.08)] text-sm">
                  <td className="py-3 pr-4 text-[rgba(0,0,0,0.7)]">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="py-3 pr-4 text-[rgba(0,0,0,0.7)]">{item.title}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-[rgba(0,0,0,0.05)] px-2 py-1 text-xs font-medium text-[rgba(0,0,0,0.7)]">
                      {item.categoryId ? categoryNameById[item.categoryId] ?? '—' : 'Sem categoria'}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit?.(item)}
                        className="flex items-center gap-1 rounded-full bg-[rgba(0,0,0,0.05)] px-3 py-1.5 text-xs font-medium text-[rgba(0,0,0,0.7)] hover:bg-[rgba(0,0,0,0.1)]"
                      >
                        Editar <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(item)}
                        disabled={togglingId === item.id}
                        className="flex items-center gap-1 rounded-full border border-[#701513] px-3 py-1.5 text-xs font-medium text-[#701513] hover:bg-[#701513]/5 disabled:opacity-50"
                      >
                        {item.status === 'PUBLISHED' ? (
                          <>
                            Ocultar <EyeOff size={12} />
                          </>
                        ) : (
                          <>
                            Publicar <Eye size={12} />
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
