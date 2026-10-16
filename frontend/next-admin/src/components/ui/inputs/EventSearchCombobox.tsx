// src/components/ui/inputs/EventSearchCombobox.tsx
'use client';

import { useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useEvents } from '@/hooks/events/useEvents';
import { useDebouncedValue } from '@/hooks/ui/useDebouncedValue';
import { useOnClickOutside } from '@/hooks/ui/useOnClickOutside';
import { AdminEvent } from '@/types/events/events';
import { eventOptionLabel } from '@/lib/events/form';

interface EventSearchComboboxProps {
  value: string; // eventId como string, '' = nenhum
  onChange: (eventId: string) => void;
}

function formatEventLabel(event: AdminEvent): string {
  const date = new Date(event.startDate);
  const day = date.toLocaleDateString('pt-BR');
  const time = date
    .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    .replace(':', 'h');
  return `${eventOptionLabel(event)}, ${day} às ${time}`;
}

export default function EventSearchCombobox({ value, onChange }: EventSearchComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  const debouncedQuery = useDebouncedValue(query, 300);

  const { data, isLoading } = useEvents({
    search: debouncedQuery || undefined,
    limit: 10,
    sortBy: 'startDate',
    order: 'desc',
  });

  const results = data?.data ?? [];

  function handleSelect(event: AdminEvent) {
    onChange(String(event.id));
    setSelectedLabel(formatEventLabel(event));
    setQuery('');
    setOpen(false);
  }

  function handleClear() {
    onChange('');
    setSelectedLabel('');
    setQuery('');
  }

  const showClear = value !== '';

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={showClear ? selectedLabel : query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (showClear) onChange('');
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar Evento por nome..."
          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-8 text-sm outline-none focus:border-[#1a4d8f]"
        />
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Limpar seleção"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && !showClear && (
        <div className="absolute left-0 top-full z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {isLoading ? (
            <p className="px-3 py-2 text-sm text-gray-400">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">
              {query ? 'Nenhum evento encontrado.' : 'Digite para buscar...'}
            </p>
          ) : (
            results.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => handleSelect(event)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                {formatEventLabel(event)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}