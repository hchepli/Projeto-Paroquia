// src/components/ui/tables/SchedulesTable.tsx
'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Schedule } from '@/types/schedules/schedule';
import Link from 'next/link';

interface SchedulesTableProps {
  items: Schedule[];
  isLoading?: boolean;
  monthLabel: string;
  search: string;
  onSearchChange: (value: string) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatTime(dateStr: string): string {
  return new Date(dateStr)
    .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    .replace(':', 'h');
}

function getRefDate(schedule: Schedule): string | null {
  return schedule.mass?.dateTime ?? schedule.event?.startDate ?? null;
}

export default function SchedulesTable({
  items,
  isLoading,
  monthLabel,
  search,
  onSearchChange,
}: SchedulesTableProps) {
  // Filtro por função continua client-side (texto livre, sem endpoint
  // dedicado pra isso ainda) — só filtra dentro da página atual carregada.
  const [roleFilter, setRoleFilter] = useState('ALL');

  const roleOptions = useMemo(() => {
    const roles = new Set<string>();
    items.forEach((s) => s.assignments.forEach((a) => roles.add(a.role)));
    return Array.from(roles).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    if (roleFilter === 'ALL') return items;
    return items.filter((s) => s.assignments.some((a) => a.role === roleFilter));
  }, [items, roleFilter]);

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
            placeholder="Buscar escalas..."
            className="w-full rounded-lg border border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.02)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#701513]"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-[rgba(0,0,0,0.1)] px-3 py-2 text-sm outline-none focus:border-[#701513]"
        >
          <option value="ALL">Todas</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-2 text-sm font-medium text-[rgba(0,0,0,0.6)]">
        Tabela de Escalas de {monthLabel}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-sm text-[rgba(0,0,0,0.5)]">
              <th className="py-2 pr-4 font-normal">Data</th>
              <th className="py-2 pr-4 font-normal">Horário</th>
              <th className="py-2 pr-4 font-normal">Função / Ministério</th>
              <th className="py-2 pr-4 font-normal">Membros escalados</th>
              <th className="py-2 text-center font-normal">Status</th>
              <th className="py-2 pl-4 text-right font-normal">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-sm text-[rgba(0,0,0,0.4)]">
                  Carregando...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-[rgba(0,0,0,0.4)]">
                  Nenhuma escala encontrada.
                </td>
              </tr>
            ) : (
              filteredItems.map((schedule) => {
                const refDate = getRefDate(schedule);
                const roles = Array.from(new Set(schedule.assignments.map((a) => a.role)));
                const memberNames = schedule.assignments.map((a) => a.volunteer.name).join(', ');

                return (
                  <tr key={schedule.id} className="border-t border-[rgba(0,0,0,0.08)] text-sm">
                    <td className="py-3 pr-4 text-[rgba(0,0,0,0.7)]">
                      {refDate ? formatDate(refDate) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-[rgba(0,0,0,0.7)]">
                      {refDate ? formatTime(refDate) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-[rgba(0,0,0,0.7)]">{roles.join(', ')}</td>
                    <td className="py-3 pr-4 text-[rgba(0,0,0,0.7)]">{memberNames || '—'}</td>
                    <td className="py-3 text-center">
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        Escalados
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <Link href={`/escalas/${schedule.id}`} className="text-sm font-medium text-[#701513] hover:underline">
                        Abrir
                      </Link>
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