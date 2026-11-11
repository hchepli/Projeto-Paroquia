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

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

/** Conteúdo reutilizável (dentro do EventFormModal ou do EventDeleteDialog). */
export function EventDeleteContent({ event, onCancel, onDeleted }: ContentProps) {
  const deleteEvent = useDeleteEvent();
  const [conflict, setConflict] = useState<EventHasSchedulesError | null>(null);
  const [error, setError] = useState<string | null>(null);

  const attendance = event._count?.attendanceConfirmations;
  const albums = event.albums ?? [];
  const albumTitles = albums.map((a) => `“${a.title}”`).join(', ');

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
      setError(
        getFriendlyErrorMessage(err, 'Não foi possível remover o evento. Tente de novo em instantes.'),
      );
    }
  }

  const attendanceLine =
    attendance === undefined
      ? 'A lista de quem avisou que vai também será apagada.'
      : attendance > 0
        ? `A lista de quem avisou que vai (${attendance} ${plural(attendance, 'pessoa', 'pessoas')}) também será apagada.`
        : null;

  const albumLine =
    albums.length === 0
      ? null
      : albums.length === 1
        ? `O álbum ${albumTitles} continua existindo, só deixa de estar ligado a este evento.`
        : `Os álbuns ${albumTitles} continuam existindo, só deixam de estar ligados a este evento.`;

  const scheduleCount = conflict?.schedules.length ?? 0;

  return (
    <div className="flex flex-col gap-4 text-base text-gray-800">
      {conflict ? (
        <>
          <p role="alert" className="font-semibold text-red-700">
            Atenção: este evento tem{' '}
            {scheduleCount > 0
              ? `${scheduleCount} ${plural(scheduleCount, 'escala', 'escalas')}`
              : 'escalas'}{' '}
            (a lista de quem vai ajudar).
          </p>

          {conflict.schedules.length > 0 && (
            <ul className="list-disc pl-5">
              {conflict.schedules.map((s) => (
                <li key={s.id}>
                  {s.pastoralGroup?.name ?? 'Sem pastoral'} — {s.assignmentsCount}{' '}
                  {plural(s.assignmentsCount, 'pessoa escalada', 'pessoas escaladas')}
                </li>
              ))}
            </ul>
          )}

          <p>
            Se você continuar, as escalas e as pessoas escaladas serão apagadas
            {attendance !== undefined && attendance > 0
              ? `, junto com a lista de quem avisou que vai (${attendance} ${plural(attendance, 'pessoa', 'pessoas')})`
              : ''}
            . Isso não pode ser desfeito.
          </p>

          {albumLine && <p>{albumLine}</p>}

          <p className="text-gray-600">
            Quer guardar o histórico? Clique em “Voltar” e use “Cancelar evento”: nada é apagado e dá
            para reativar depois.
          </p>
        </>
      ) : (
        <>
          <p>
            Remover o evento <strong>{event.name}</strong>? Ele será apagado para sempre.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {attendanceLine && <li>{attendanceLine}</li>}
            {albumLine && <li>{albumLine}</li>}
            <li>Se houver escalas ligadas a este evento, vamos avisar antes de apagar.</li>
          </ul>
          <p className="text-gray-600">
            Só quer tirar o evento do calendário e do site? Clique em “Voltar” e use “Cancelar
            evento”: dá para reativar depois.
          </p>
        </>
      )}

      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          disabled={deleteEvent.isPending}
          className="rounded-lg bg-gray-100 px-4 py-2.5 text-base font-medium hover:bg-gray-200 disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={() => run(Boolean(conflict))}
          disabled={deleteEvent.isPending}
          className="rounded-lg bg-red-600 px-4 py-2.5 text-base font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleteEvent.isPending
            ? 'Removendo...'
            : conflict
              ? 'Sim, remover tudo'
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
    <Modal open onClose={onClose} title="Remover evento">
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
