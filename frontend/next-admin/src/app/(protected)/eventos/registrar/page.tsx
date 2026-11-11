// src/app/comunidade/eventos/registrar/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import EventFormFields from '@/components/ui/forms/EventFormFields';
import FormActions from '@/components/ui/buttons/FormActions';
import { useCreateEvent } from '@/hooks/events/useCreateEvent';
import { usePermissions } from '@/hooks/auth/usePermissions';
import {
  buildEventPayload,
  EMPTY_EVENT_FORM,
  EventFormValues,
  getEventSaveError,
  validateEventForm,
} from '@/lib/events/form';

export default function CriarEventoPage() {
  const router = useRouter();
  const { canManageEvents, isLoading: permLoading } = usePermissions();
  const createEvent = useCreateEvent();

  const [values, setValues] = useState<EventFormValues>(EMPTY_EVENT_FORM);
  const [error, setError] = useState<string | null>(null);

  function handleChange(patch: Partial<EventFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validation = validateEventForm(values);
    if (validation) {
      setError(validation);
      return;
    }

    try {
      // pastoralGroupIds vai no próprio POST (uma transaction no back).
      const event = await createEvent.mutateAsync(buildEventPayload(values, 'create'));
      router.push(`/comunidade/eventos/${event.id}`);
    } catch (err) {
      setError(getEventSaveError(err, 'Erro ao criar evento.'));
    }
  }

  if (permLoading) return <p className="mt-8 text-sm text-gray-400">Carregando...</p>;

  if (!canManageEvents) {
    return (
      <>
        <Header title="Novo Evento" description="" onBack={() => router.back()} />
        <p className="mt-8 text-sm text-gray-600">
          Você não tem permissão para criar eventos. Somente Admin Geral e Secretaria.
        </p>
      </>
    );
  }

  return (
    <>
      <Header
        title="Novo Evento"
        description="Cadastre um novo evento da paróquia."
        onBack={() => router.back()}
      />

      <div className="max-w-2xl py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <EventFormFields values={values} onChange={handleChange} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <FormActions
            onCancel={() => router.push('/comunidade/eventos')}
            submitLabel="Criar Evento"
            submitting={createEvent.isPending}
          />
        </form>
      </div>
    </>
  );
}