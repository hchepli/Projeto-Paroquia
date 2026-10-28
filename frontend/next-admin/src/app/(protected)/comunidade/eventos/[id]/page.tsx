// src/app/(protected)/comunidade/eventos/[id]/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import EventFormFields from '@/components/ui/forms/EventFormFields';
import EventDeleteDialog from '@/components/ui/forms/EventDeleteConfirm';
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

export default function EventoDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const eventId = Number(params.id);

  const { canManageEvents, isLoading: permLoading } = usePermissions();
  const { data: event, isLoading, isError, error, refetch } = useEvent(eventId);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading || permLoading) {
    return <p className="mt-8 text-sm text-gray-400">Carregando evento...</p>;
  }

  if (isError || !event) {
    return (
      <>
        <Header title="Evento" description="" onBack={() => router.push('/comunidade/eventos')} />
        <p className="mt-8 text-sm text-red-600">
          {getFriendlyErrorMessage(error, 'Erro ao buscar evento.')}{' '}
          <button onClick={() => refetch()} className="underline">
            Tentar novamente
          </button>
        </p>
      </>
    );
  }

  return (
    <>
      <Header
        title={`${canManageEvents ? 'Editar' : 'Evento'}: ${event.name}`}
        description={
          canManageEvents ? 'Atualize os dados do evento.' : 'Visualização somente leitura.'
        }
        actions={
          canManageEvents
            ? [
                {
                  label: 'Ver confirmações de presença',
                  onClick: () => router.push(`/comunidade/eventos/${eventId}/confirmacoes`),
                },
              ]
            : []
        }
        onBack={() => router.push('/comunidade/eventos')}
      />

      {event.status === 'CANCELLED' && (
        <div className="mt-6 max-w-2xl rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Este evento está cancelado: não aparece no calendário nem no site.
          {canManageEvents && ' Altere o status para "Ativo" para reativá-lo.'}
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
          onDeleted={() => router.push('/comunidade/eventos')}
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
      router.push('/comunidade/eventos');
    } catch (err) {
      setError(getEventSaveError(err, 'Erro ao salvar evento.'));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
      <EventFormFields
        values={values}
        onChange={handleChange}
        readOnly={readOnly}
        showStatus={!readOnly}
      />

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!readOnly && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onRequestDelete}
            className="rounded-md px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Remover evento
          </button>
          <button
            type="submit"
            disabled={updateEvent.isPending}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {updateEvent.isPending ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      )}
    </form>
  );
}