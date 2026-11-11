// src/app/(protected)/eventos/registrar/page.tsx
'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

// Só caminho interno (começa com "/", mas não "//"). Se preferir, troque pelo safeBackPath
// compartilhado que /missas/nova-missa usa (o caminho dele não foi enviado).
function safeBackPath(value: string | null, fallback: string) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

function CriarEventoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const backTo = safeBackPath(searchParams.get('voltar'), '/eventos');

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
      await createEvent.mutateAsync(buildEventPayload(values, 'create'));
      router.push(backTo);
    } catch (err) {
      setError(
        getEventSaveError(err, 'Não foi possível criar o evento. Confira os dados e tente de novo.'),
      );
    }
  }

  if (permLoading) return <p className="mt-8 text-base text-gray-600">Carregando...</p>;

  if (!canManageEvents) {
    return (
      <>
        <Header title="Novo evento" description="" onBack={() => router.push(backTo)} />
        <p role="alert" className="mt-8 text-base text-gray-800">
          Você não tem permissão para criar eventos. Peça para a Secretaria ou o Admin Geral
          cadastrar.
        </p>
      </>
    );
  }

  return (
    <>
      <Header
        title="Novo evento"
        description="Preencha os dados do evento. Só nome, começo e local são obrigatórios."
        onBack={() => router.push(backTo)}
      />

      <div className="py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <EventFormFields values={values} onChange={handleChange} />

          {error && (
            <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-base text-red-700">
              {error}
            </div>
          )}

          <FormActions
            onCancel={() => router.push(backTo)}
            submitLabel="Criar evento"
            submitting={createEvent.isPending}
          />
        </form>
      </div>
    </>
  );
}

export default function CriarEventoPage() {
  // useSearchParams exige Suspense no build do Next.
  return (
    <Suspense fallback={<p className="mt-8 text-base text-gray-600">Carregando...</p>}>
      <CriarEventoContent />
    </Suspense>
  );
}
