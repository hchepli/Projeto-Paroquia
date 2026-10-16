// src/components/ui/forms/EventFormModal.tsx
'use client';

import { FormEvent, useState } from 'react';
import Modal from '@/components/ui/modals/Modal';
import EventFormFields from '@/components/ui/forms/EventFormFields';
import { EventDeleteContent } from '@/components/ui/forms/EventDeleteConfirm';
import { useEvent } from '@/hooks/events/useEvent';
import { useCreateEvent } from '@/hooks/events/useCreateEvent';
import { useUpdateEvent } from '@/hooks/events/useUpdateEvent';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { getFriendlyErrorMessage } from '@/lib/errors';
import {
  buildEventPayload,
  EMPTY_EVENT_FORM,
  EventFormValues,
  eventToFormValues,
  getEventSaveError,
  validateEventForm,
} from '@/lib/events/form';
import { AdminEvent } from '@/types/events/events';

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Id do evento a editar/visualizar. null/undefined = modo criação. */
  eventId?: number | null;
}

export default function EventFormModal({ open, onClose, eventId = null }: EventFormModalProps) {
  const { canManageEvents } = usePermissions();
  const isEditing = eventId !== null;
  const { data: event, isLoading, isError, error, refetch } = useEvent(open ? eventId : null);
  const [view, setView] = useState<'form' | 'delete'>('form');

  if (!open) return null;

  function handleClose() {
    setView('form');
    onClose();
  }

  const title =
    view === 'delete'
      ? 'Remover Evento'
      : !isEditing
        ? 'Novo Evento'
        : canManageEvents
          ? 'Editar Evento'
          : 'Detalhes do Evento';

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      {isEditing && isLoading && <p className="text-sm text-gray-400">Carregando...</p>}

      {isEditing && isError && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-red-600">
            {getFriendlyErrorMessage(error, 'Erro ao buscar evento.')}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg bg-[#1a4d8f] px-4 py-2 text-sm font-medium text-white hover:bg-[#153e73]"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {event && view === 'delete' && (
        <EventDeleteContent
          event={event}
          onCancel={() => setView('form')}
          onDeleted={handleClose}
        />
      )}

      {view === 'form' && !isEditing && canManageEvents && (
        <EventModalForm key="new" event={null} onClose={handleClose} />
      )}

      {view === 'form' && !isEditing && !canManageEvents && (
        <p className="text-sm text-gray-600">Você não tem permissão para criar eventos.</p>
      )}

      {event && view === 'form' && (
        <EventModalForm
          key={event.id}
          event={event}
          readOnly={!canManageEvents}
          onClose={handleClose}
          onRequestDelete={() => setView('delete')}
        />
      )}
    </Modal>
  );
}

function EventModalForm({
  event,
  readOnly,
  onClose,
  onRequestDelete,
}: {
  event: AdminEvent | null;
  readOnly?: boolean;
  onClose: () => void;
  onRequestDelete?: () => void;
}) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const [values, setValues] = useState<EventFormValues>(() =>
    event ? eventToFormValues(event) : EMPTY_EVENT_FORM,
  );
  const [error, setError] = useState<string | null>(null);
  const pending = createEvent.isPending || updateEvent.isPending;

  function handleChange(patch: Partial<EventFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setError(null);

    const validation = validateEventForm(values);
    if (validation) {
      setError(validation);
      return;
    }

    try {
      if (event) {
        await updateEvent.mutateAsync({ id: event.id, ...buildEventPayload(values, 'edit') });
      } else {
        await createEvent.mutateAsync(buildEventPayload(values, 'create'));
      }
      onClose();
    } catch (err) {
      setError(getEventSaveError(err, event ? 'Erro ao atualizar evento.' : 'Erro ao criar evento.'));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <EventFormFields
        values={values}
        onChange={handleChange}
        readOnly={readOnly}
        showStatus={Boolean(event) && !readOnly}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="mt-2 flex items-center justify-between gap-2">
        {event && !readOnly ? (
          <button
            type="button"
            onClick={onRequestDelete}
            disabled={pending}
            className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Remover evento
          </button>
        ) : (
          <span />
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
          >
            {readOnly ? 'Fechar' : 'Cancelar'}
          </button>
          {!readOnly && (
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[#1a4d8f] px-4 py-2 text-sm font-medium text-white hover:bg-[#153e73] disabled:opacity-50"
            >
              {pending ? 'Salvando...' : event ? 'Salvar Alterações' : 'Criar Evento'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}