// src/components/ui/forms/MassDeleteConfirm.tsx
'use client';

import { useState } from 'react';
import { MassHasSchedulesError, useDeleteMass } from '@/hooks/masses/useDeleteMass';
import { getErrorMessage } from '@/lib/errors';
import { MassDeleteResult } from '@/types/masses/masses';

interface MassDeleteConfirmProps {
  mass: { id: number; title: string; dateTime: string };
  onCancel: () => void;
  onDeleted: (result: MassDeleteResult) => void;
}

/**
 * Conteúdo (sem Modal próprio) da remoção de Missa, com o aviso RN016:
 * 1) confirmação simples; 2) se o back responder 409 MASS_HAS_SCHEDULES,
 * lista as Escalas/Eventos afetados e pede confirmação extra.
 */
export default function MassDeleteConfirm({ mass, onCancel, onDeleted }: MassDeleteConfirmProps) {
  const deleteMass = useDeleteMass();
  const [conflict, setConflict] = useState<MassHasSchedulesError | null>(null);
  const [error, setError] = useState<string | null>(null);

  const when = new Date(mass.dateTime).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  async function handleDelete(confirm: boolean) {
    setError(null);
    try {
      const result = await deleteMass.mutateAsync({ id: mass.id, confirm });
      onDeleted(result);
    } catch (err) {
      if (err instanceof MassHasSchedulesError) {
        setConflict(err);
        return;
      }
      setError(getErrorMessage(err, 'Erro ao remover missa.'));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {conflict ? (
        <>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-medium">
              A missa "{mass.title}" ({when}) possui escalas vinculadas.
            </p>
            <p className="mt-1">
              Se continuar, as escalas abaixo e todas as suas atribuições serão apagadas.
            </p>

            {conflict.schedules.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {conflict.schedules.map((s) => (
                  <li key={s.id}>
                    {s.pastoralGroup?.name ?? 'Sem pastoral'} — {s.assignmentsCount}{' '}
                    {s.assignmentsCount === 1 ? 'atribuição' : 'atribuições'}
                  </li>
                ))}
              </ul>
            )}

            {conflict.linkedEvents.length > 0 && (
              <>
                <p className="mt-2">Eventos que perderão a correlação com esta missa:</p>
                <ul className="mt-1 list-disc pl-5">
                  {conflict.linkedEvents.map((e) => (
                    <li key={e.id}>{e.name}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={deleteMass.isPending}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => handleDelete(true)}
              disabled={deleteMass.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteMass.isPending ? 'Removendo...' : 'Remover mesmo assim'}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-700">
            Remover a missa <span className="font-medium">"{mass.title}"</span> ({when})? Esta ação
            não pode ser desfeita.
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={deleteMass.isPending}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleDelete(false)}
              disabled={deleteMass.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteMass.isPending ? 'Removendo...' : 'Remover'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
