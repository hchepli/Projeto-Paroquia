'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import FieldLabel from './FieldLabel';

export type ComboOption = {
  value: string;
  label: string;
  searchText?: string;
};

interface ComboboxInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: ComboOption[];
  required?: boolean;
  emptyMessage?: string;
  hideLabel?: boolean;
}

export default function ComboboxInput({
  label,
  value,
  onChange,
  placeholder,
  options,
  required,
  emptyMessage = 'Nenhum resultado encontrado.',
  hideLabel,
}: ComboboxInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    const normalized = query.toLowerCase();
    return options.filter((o) => (o.searchText ?? o.label).toLowerCase().includes(normalized));
  }, [options, query]);

  function handleSelect(option: ComboOption) {
    onChange(option.value);
    setQuery('');
    setOpen(false);
  }

  function handleClear() {
    onChange('');
    setQuery('');
  }

  return (
    <div ref={containerRef} className="relative">
      <FieldLabel label={label} required={required} hidden={hideLabel} />

      <div className="relative">
        <input
          type="text"
          value={open ? query : (selectedOption?.label ?? '')}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          placeholder={placeholder}
          className="w-full px-5 py-3 border border-gray-300 rounded-lg ring-1 ring-gray-400 bg-white text-sm placeholder-gray-400 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700 focus:border-gray-700 transition duration-150"
        />
        <ChevronDown
          className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="max-h-60 overflow-y-auto p-1.5">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="w-full rounded-md px-4 py-2.5 text-left text-sm text-gray-500 hover:bg-gray-50"
              >
                Limpar seleção
              </button>
            )}
            {filteredOptions.length === 0 ? (
              <p className="px-4 py-2.5 text-sm text-gray-400">{emptyMessage}</p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`flex w-full items-center justify-between rounded-md px-4 py-2.5 text-left text-sm transition ${
                      isSelected ? 'bg-gray-100 text-gray-800' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className="h-4 w-4 text-gray-700" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}