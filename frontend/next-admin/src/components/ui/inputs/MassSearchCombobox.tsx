// src/components/ui/inputs/MassSearchCombobox.tsx
'use client';

import { useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useMasses } from '@/hooks/masses/useMasses';
import { useDebouncedValue } from '@/hooks/ui/useDebouncedValue';
import { useOnClickOutside } from '@/hooks/ui/useOnClickOutside';
import { Mass } from '@/types/masses/masses';

interface MassSearchComboboxProps {
  value: string; // massId como string, '' = nenhuma
  onChange: (massId: string) => void;
}

function formatMassLabel(mass: Mass): string {
  const date = new Date(mass.dateTime);
  const day = date.toLocaleDateString('pt-BR');
  const time = date
    .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    .replace(':', 'h');
  return `${mass.title}, ${day} às ${time}`;
}

export default function MassSearchCombobox({ value, onChange }: MassSearchComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  const debouncedQuery = useDebouncedValue(query, 300);

  const { data, isLoading } = useMasses({
    search: debouncedQuery || undefined,
    limit: 10,
  });

  const results = data?.data ?? [];

  function handleSelect(mass: Mass) {
    onChange(String(mass.id));
    setSelectedLabel(formatMassLabel(mass));
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
            if (showClear) onChange(''); // digitar de novo desfaz a seleção atual
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar Missa por título..."
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
              {query ? 'Nenhuma missa encontrada.' : 'Digite para buscar...'}
            </p>
          ) : (
            results.map((mass) => (
              <button
                key={mass.id}
                type="button"
                onClick={() => handleSelect(mass)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                {formatMassLabel(mass)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}