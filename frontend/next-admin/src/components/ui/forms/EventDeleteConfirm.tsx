// src/components/ui/forms/EventDeleteConfirm.tsx
'use client';

import { useState } from 'react';
import Modal from '@/components/ui/modals/Modal';
import { EventHasSchedulesError, useDeleteEvent } from '@/hooks/events/useDeleteEvent';
import { getFriendlyErrorMessage } from '@/lib/errors';

interface EventRef {
  id: number;
  name: string;
  /** Opcionais: quando presentes, o aviso mostra o que será apagado/desvinculado. */
  _count?: { attendanceConfirmations: number };
  albums?: { id: number; title: string }[];
}

interface ContentProps {
  event: EventRef;
  onCancel: () => void;
  onDeleted: () => void;
}

/** Conteúdo reutilizável (dentro do EventFormModal ou do EventDeleteDialog). */
export function EventDeleteContent({ event, onCancel, onDeleted }: ContentProps) {
  const deleteEvent = useDeleteEvent();
  const [conflict, setConflict] = useState<EventHasSchedulesError | null>(null);
  const [error, setError] = useState<string | null>(null);

  const attendance = event._count?.attendanceConfirmations;
  const albums = event.albums ?? [];

  async function run(confirm: boolean) {
    setError(null);
    try {
      await deleteEvent.mutateAsync({ id: event.id, confirm });
      onDeleted();
    } catch (err) {
      if (err instanceof EventHasSchedulesError) {
        setConflict(err);
        return;
      }
      setError(getFriendlyErrorMessage(err, 'Erro ao remover evento.'));
    }
  }

  return (
    <div className="flex flex-col gap-4 text-sm text-gray-700">
      {conflict ? (
        <>
          <p className="font-medium text-red-700">{conflict.message}</p>

          {conflict.schedules.length > 0 && (
            <div>
              <p className="mb-1 font-medium">Escalas que serão removidas:</p>
              <ul className="list-disc pl-5">
                {conflict.schedules.map((s) => (
                  <li key={s.id}>
                    {s.pastoralGroup?.name ?? 'Sem pastoral'} — {s.assignmentsCount}{' '}
                    {s.assignmentsCount === 1 ? 'atribuição' : 'atribuições'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {conflict.linkedAlbums.length > 0 && (
            <div>
              <p className="mb-1 font-medium">Álbuns que serão desvinculados (não são apagados):</p>
              <ul className="list-disc pl-5">
                {conflict.linkedAlbums.map((a) => (
                  <li key={a.id}>{a.title}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-gray-500">
            Prefere manter o histórico? Cancele o evento em vez de removê-lo.
          </p>
        </>
      ) : (
        <>
          <p>
            Remover o evento <strong>{event.name}</strong>?{' '}
            {attendance !== undefined
              ? `As ${attendance} confirmação(ões) de presença registradas também serão apagadas.`
              : 'As confirmações de presença registradas também serão apagadas.'}{' '}
            Esta ação não pode ser desfeita.
          </p>
          {albums.length > 0 && (
            <p>
              {albums.length === 1 ? 'O álbum' : 'Os álbuns'}{' '}
              <strong>{albums.map((a) => a.title).join(', ')}</strong> ficará(ão) sem vínculo com
              evento (não será(ão) apagado(s)).
            </p>
          )}
          <p className="text-gray-500">
            Se só quer tirar o evento do ar, use &quot;Cancelar evento&quot; (reversível).
          </p>
        </>
      )}

      {error && <p className="text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={deleteEvent.isPending}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={() => run(Boolean(conflict))}
          disabled={deleteEvent.isPending}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleteEvent.isPending
            ? 'Removendo...'
            : conflict
              ? 'Remover mesmo assim'
              : 'Remover evento'}
        </button>
      </div>
    </div>
  );
}

interface DialogProps {
  event: EventRef;
  onClose: () => void;
  onDeleted?: () => void;
}

/** Diálogo standalone, usado pela lista e pela página de detalhe. */
export default function EventDeleteDialog({ event, onClose, onDeleted }: DialogProps) {
  return (
    <Modal open onClose={onClose} title="Remover Evento">
      <EventDeleteContent
        event={event}
        onCancel={onClose}
        onDeleted={() => {
          onDeleted?.();
          onClose();
        }}
      />
    </Modal>
  );
}