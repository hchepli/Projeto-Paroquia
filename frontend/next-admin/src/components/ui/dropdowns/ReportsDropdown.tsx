// src/components/ui/schedules/ReportsDropdown.tsx
'use client';

import { useRef, useState } from 'react';
import { ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import ActionButton from '@/components/ui/buttons/ActionButton';
import { useOnClickOutside } from '@/hooks/ui/useOnClickOutside';

interface ReportsDropdownProps {
  buildQuery: () => URLSearchParams;
}

async function downloadReport(format: 'csv' | 'pdf', query: URLSearchParams) {
  query.set('format', format);
  const res = await fetch(`/api/schedules/report/export?${query.toString()}`);
  if (!res.ok) throw new Error('Erro ao gerar relatório.');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-escalas.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function ReportsDropdown({ buildQuery }: ReportsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [loadingFormat, setLoadingFormat] = useState<'csv' | 'pdf' | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  async function handleDownload(format: 'csv' | 'pdf') {
    setLoadingFormat(format);
    try {
      await downloadReport(format, buildQuery());
    } catch {
      alert('Erro ao gerar relatório.');
    } finally {
      setLoadingFormat(null);
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <ActionButton
        action={{
          label: 'Relatórios',
          icon: ChevronDown,
          iconPosition: 'right',
          onClick: () => setOpen((v) => !v),
        }}
      />

      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-[12px] border border-gray-200 bg-white p-1 shadow-lg">
          <button
            onClick={() => handleDownload('csv')}
            disabled={loadingFormat !== null}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <FileSpreadsheet size={14} />
            {loadingFormat === 'csv' ? 'Gerando...' : 'Baixar CSV'}
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            disabled={loadingFormat !== null}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <FileText size={14} />
            {loadingFormat === 'pdf' ? 'Gerando...' : 'Baixar PDF'}
          </button>
        </div>
      )}
    </div>
  );
}