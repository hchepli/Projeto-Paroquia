// src/components/ui/tables/GenericTable.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface GenericTableColumn<T> {
  /** Chave única da coluna (usada como key do <th>/<td>, não precisa bater com campo do item). */
  key: string;
  label: string;
  /** Renderiza o conteúdo da célula a partir do item da linha. */
  render: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface GenericTableAction<T> {
  label: string | ((item: T) => string);
  onClick: (item: T) => void;
  /** 'default' = pill outline (#701513); 'danger' = pill vermelho. */
  variant?: 'default' | 'danger';
  disabled?: (item: T) => boolean;
}

export interface GenericTableFilterOption {
  value: string;
  label: string;
}

export interface GenericTableFilter {
  key: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: GenericTableFilterOption[];
}

interface GenericTableProps<T> {
  columns: GenericTableColumn<T>[];
  items: T[];
  rowKey: (item: T) => string | number;
  actions?: GenericTableAction<T>[];
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: GenericTableFilter[];
  /** Slot livre no canto direito do header, ex: botão "Ver Todas". */
  headerSlot?: React.ReactNode;
}

function alignClass(align: GenericTableColumn<unknown>['align']) {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
}

function TableFilterDropdown({ filter }: { filter: GenericTableFilter }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = filter.options.find((o) => o.value === filter.value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(value: string) {
    filter.onChange(value);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-[rgba(0,0,0,0.1)] px-3 py-2 text-sm text-[rgba(0,0,0,0.7)] outline-none hover:bg-gray-50 focus:border-[#701513]"
      >
        <span>{selectedOption?.label ?? filter.placeholder}</span>
        <ChevronDown
          size={14}
          className={`text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 min-w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="max-h-60 overflow-y-auto p-1.5">
            {filter.options.map((option) => {
              const isSelected = option.value === filter.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`block w-full whitespace-nowrap rounded-md px-4 py-2 text-left text-sm transition ${
                    isSelected ? 'bg-gray-100 text-gray-800' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GenericTable<T>({
  columns,
  items,
  rowKey,
  actions,
  isLoading,
  loadingMessage = 'Carregando...',
  emptyMessage = 'Nenhum item encontrado.',
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  headerSlot,
}: GenericTableProps<T>) {
  const hasToolbar = onSearchChange !== undefined || (filters && filters.length > 0) || headerSlot;
  const colSpan = columns.length + (actions && actions.length > 0 ? 1 : 0);

  return (
    <div className="w-full rounded-[16px] border border-[rgba(0,0,0,0.3)] p-4">
      {hasToolbar && (
        <div className="mb-4 flex items-center gap-3">
          {onSearchChange && (
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.02)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#701513]"
              />
            </div>
          )}

          {filters?.map((filter) => (
            <TableFilterDropdown key={filter.key} filter={filter} />
          ))}

          {headerSlot}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-sm text-[rgba(0,0,0,0.5)]">
              {columns.map((col) => (
                <th key={col.key} className={`py-2 pr-4 font-normal ${alignClass(col.align)}`}>
                  {col.label}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="py-2 text-center font-normal">Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={colSpan} className="py-6 text-center text-sm text-[rgba(0,0,0,0.4)]">
                  {loadingMessage}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="py-6 text-center text-sm text-[rgba(0,0,0,0.4)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={rowKey(item)} className="border-t border-[rgba(0,0,0,0.08)] text-sm">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 pr-4 text-[rgba(0,0,0,0.7)] ${alignClass(col.align)}`}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {actions.map((action, idx) => {
                          const label =
                            typeof action.label === 'function' ? action.label(item) : action.label;
                          const isDisabled = action.disabled?.(item) ?? false;
                          const isDanger = action.variant === 'danger';

                          return (
                            <button
                              key={idx}
                              onClick={() => action.onClick(item)}
                              disabled={isDisabled}
                              className={
                                isDanger
                                  ? 'rounded-full border border-red-600 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50'
                                  : 'rounded-full border border-[#701513] px-3 py-1.5 text-xs font-medium text-[#701513] hover:bg-[#701513]/5 disabled:opacity-50'
                              }
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
