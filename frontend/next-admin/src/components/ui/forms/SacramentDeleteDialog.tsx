// src/components/ui/forms/SacramentDeleteDialog.tsx
'use client';

import { useState } from 'react';
import { useDeleteSacrament } from '@/hooks/sacraments/useDeleteSacrament';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { Sacrament } from '@/types/sacraments/sacraments';

interface Props {
  sacrament: Sacrament;
  onClose: () => void;
  onDeleted?: () => void;
}

export default function SacramentDeleteDialog({ sacrament, onClose, onDeleted }: Props) {
  const del = useDeleteSacrament();
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    try {
      await del.mutateAsync(sacrament.id);
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Erro ao remover sacramento.'));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Remover sacramento</h2>
        <p className="mt-2 text-sm text-gray-600">
          Remover &quot;{sacrament.name}&quot;? Ele sai do site e a ação não pode ser desfeita.
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={del.isPending}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={del.isPending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {del.isPending ? 'Removendo...' : 'Remover'}
          </button>
        </div>
      </div>
    </div>
  );
}
