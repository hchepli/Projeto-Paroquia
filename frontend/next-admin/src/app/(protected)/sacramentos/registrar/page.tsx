'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import SacramentFormFields from '@/components/ui/forms/SacramentFormFields';
import FormActions from '@/components/ui/buttons/FormActions';
import { useCreateSacrament } from '@/hooks/sacraments/useCreateSacrament';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { getSacramentSaveError } from '@/lib/sacraments/errors';
import {
  buildSacramentPayload,
  EMPTY_SACRAMENT_FORM,
  SacramentFormValues,
  validateSacramentForm,
} from '@/lib/sacraments/form';

function safeBackPath(value: string | null, fallback: string) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

function CriarSacramentoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const backTo = safeBackPath(searchParams.get('voltar'), '/sacramentos');

  const { canManageSacraments, isLoading: permLoading } = usePermissions();
  const createSacrament = useCreateSacrament();

  const [values, setValues] = useState<SacramentFormValues>(EMPTY_SACRAMENT_FORM);
  const [error, setError] = useState<string | null>(null);

  function handleChange(patch: Partial<SacramentFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validation = validateSacramentForm(values);
    if (validation) {
      setError(validation);
      return;
    }

    try {
      // Sem posição: o back coloca no final da lista.
      await createSacrament.mutateAsync(buildSacramentPayload(values, 'create'));
      router.push(backTo);
    } catch (err) {
      setError(getSacramentSaveError(err));
    }
  }

  if (permLoading) return <p className="mt-8 text-base text-gray-500">Carregando...</p>;

  if (!canManageSacraments) {
    return (
      <>
        <Header title="Novo sacramento" description="" onBack={() => router.push(backTo)} />
        <p role="alert" className="mt-8 text-base text-gray-700">
          Você não pode criar sacramentos. Apenas o Admin Geral e a Secretaria podem. Volte para a
          lista para ver os sacramentos.
        </p>
      </>
    );
  }

  return (
    <>
      <Header
        title="Novo sacramento"
        description="Preencha os dados. Ele entra no final da lista e depois você pode mudar a posição."
        onBack={() => router.push(backTo)}
      />

      <form onSubmit={handleSubmit} className="space-y-6 py-6">
        <SacramentFormFields values={values} onChange={handleChange} />

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-base text-red-700">
            {error}
          </p>
        )}

        <FormActions
          onCancel={() => router.push(backTo)}
          submitLabel="Criar sacramento"
          submitting={createSacrament.isPending}
        />
      </form>
    </>
  );
}

export default function CriarSacramentoPage() {
  return (
    <Suspense fallback={<p className="mt-8 text-base text-gray-500">Carregando...</p>}>
      <CriarSacramentoContent />
    </Suspense>
  );
}