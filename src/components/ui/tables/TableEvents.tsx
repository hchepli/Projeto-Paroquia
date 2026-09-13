// src/components/ui/tables/EventsTable.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Event } from '@/types/events/events';

interface EventsTableProps {
  items: Event[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onRemove: (event: Event) => void;
  isRemoving: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function TableEvents({
  items,
  isLoading,
  search,
  onSearchChange,
  onRemove,
  isRemoving,
}: EventsTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700">Eventos</h2>
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-400"
        />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-gray-500">
            <th className="px-4 py-2 font-medium">Nome</th>
            <th className="px-4 py-2 font-medium">Data</th>
            <th className="px-4 py-2 font-medium">Local</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                Carregando eventos...
              </td>
            </tr>
          )}

          {!isLoading && items.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                Nenhum evento encontrado.
              </td>
            </tr>
          )}

          {!isLoading &&
            items.map((event) => (
              <tr key={event.id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 font-medium text-gray-800">{event.name}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(event.startDate)}</td>
                <td className="px-4 py-3 text-gray-600">{event.location}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      event.status === 'ACTIVE'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {event.status === 'ACTIVE' ? 'Ativo' : 'Cancelado'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => router.push(`/comunidade/eventos/${event.id}`)}
                      className="text-xs font-medium text-gray-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => router.push(`/comunidade/eventos/${event.id}/confirmacoes`)}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Confirmações
                    </button>
                    <button
                      onClick={() => onRemove(event)}
                      disabled={isRemoving}
                      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}