// src/app/(protected)/eventos/[id]/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import EventFormFields from '@/components/ui/forms/EventFormFields';
import EventDeleteDialog from '@/components/ui/forms/EventDeleteConfirm';
import FormActions from '@/components/ui/buttons/FormActions';
import { useEvent } from '@/hooks/events/useEvent';
import { useUpdateEvent } from '@/hooks/events/useUpdateEvent';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { getFriendlyErrorMessage } from '@/lib/errors';
import {
  buildEventPayload,
  EventFormValues,
  eventToFormValues,
  getEventSaveError,
  validateEventForm,
} from '@/lib/events/form';
import { AdminEvent } from '@/types/events/events';

const LIST_PATH = '/eventos';

export default function EventoDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const eventId = Number(params.id);

  const { canManageEvents, isLoading: permLoading } = usePermissions();
  const { data: event, isLoading, isError, error, refetch } = useEvent(eventId);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading || permLoading) {
    return <p className="mt-8 text-base text-gray-600">Carregando o evento...</p>;
  }

  if (isError || !event) {
    return (
      <>
        <Header title="Evento" description="" onBack={() => router.push(LIST_PATH)} />
        <div role="alert" className="mt-8 text-base text-red-700">
          {getFriendlyErrorMessage(
            error,
            'Não foi possível abrir este evento. Volte para a lista e escolha o evento de novo.',
          )}{' '}
          <button type="button" onClick={() => refetch()} className="font-medium underline">
            Tentar novamente
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={`${canManageEvents ? 'Editar' : 'Evento'}: ${event.name}`}
        description={
          canManageEvents ? 'Mude o que for preciso e clique em “Salvar alterações”.' : 'Só para ver: não é possível mudar nada.'
        }
        actions={
          canManageEvents
            ? [
                {
                  label: 'Ver quem vai',
                  // Assume que Header repassa `kind` ao ActionButton (ver relatório).
                  kind: 'navigate',
                  onClick: () => router.push(`/eventos/${eventId}/confirmacoes`),
                },
              ]
            : []
        }
        onBack={() => router.push(LIST_PATH)}
      />

      {event.status === 'CANCELLED' && (
        <div
          role="status"
          className="mt-6 rounded-md bg-amber-50 px-3 py-2 text-base text-amber-900"
        >
          Este evento está cancelado e não aparece no calendário nem no site.
          {canManageEvents && ' Para reativar, mude a “Situação do evento” para “Ativo” e salve.'}
        </div>
      )}

      {/* key só por id (padrão de Missa): refetch/edição de outro admin não descarta o que está sendo digitado. */}
      <EventEditForm
        key={event.id}
        event={event}
        readOnly={!canManageEvents}
        onRequestDelete={() => setDeleteOpen(true)}
      />

      {deleteOpen && (
        <EventDeleteDialog
          event={event}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => router.push(LIST_PATH)}
        />
      )}
    </>
  );
}

function EventEditForm({
  event,
  readOnly,
  onRequestDelete,
}: {
  event: AdminEvent;
  readOnly: boolean;
  onRequestDelete: () => void;
}) {
  const router = useRouter();
  const updateEvent = useUpdateEvent();
  const [values, setValues] = useState<EventFormValues>(() => eventToFormValues(event));
  const [error, setError] = useState<string | null>(null);

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
      await updateEvent.mutateAsync({ id: event.id, ...buildEventPayload(values, 'edit') });
      router.push(LIST_PATH);
    } catch (err) {
      setError(
        getEventSaveError(err, 'Não foi possível salvar as alterações. Confira os dados e tente de novo.'),
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <EventFormFields
        values={values}
        onChange={handleChange}
        readOnly={readOnly}
        showStatus={!readOnly}
      />

      {error && (
        <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-base text-red-700">
          {error}
        </div>
      )}

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onRequestDelete}
            disabled={updateEvent.isPending}
            className="rounded-md px-4 py-2.5 text-base font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Remover evento
          </button>
          <FormActions
            onCancel={() => router.push(LIST_PATH)}
            submitLabel="Salvar alterações"
            submitting={updateEvent.isPending}
          />
        </div>
      )}
    </form>
  );
}
