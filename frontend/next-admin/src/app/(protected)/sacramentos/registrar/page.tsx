// src/app/(protected)/sacramentos/registrar/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import SacramentFormFields from '@/components/ui/forms/SacramentFormFields';
import FormActions from '@/components/ui/buttons/FormActions';
import { useCreateSacrament } from '@/hooks/sacraments/useCreateSacrament';
import { usePermissions } from '@/hooks/auth/usePermissions';
import {
  buildSacramentPayload,
  EMPTY_SACRAMENT_FORM,
  getSacramentSaveError,
  SacramentFormValues,
  validateSacramentForm,
} from '@/lib/sacraments/form';

export default function CriarSacramentoPage() {
  const router = useRouter();
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
      // Sem displayOrder: o back coloca no final da lista.
      await createSacrament.mutateAsync(buildSacramentPayload(values, 'create'));
      router.push('/sacramentos');
    } catch (err) {
      setError(getSacramentSaveError(err, 'Erro ao criar sacramento.'));
    }
  }

  if (permLoading) return <p className="mt-8 text-sm text-gray-400">Carregando...</p>;

  if (!canManageSacraments) {
    return (
      <>
        <Header title="Novo Sacramento" description="" onBack={() => router.back()} />
        <p className="mt-8 text-sm text-gray-600">
          Você não tem permissão para criar sacramentos. Somente Admin Geral e Secretaria.
        </p>
      </>
    );
  }

  return (
    <>
      <Header
        title="Novo Sacramento"
        description="Cadastre um novo sacramento. Ele entra no final da lista."
        onBack={() => router.back()}
      />

      <div className="max-w-2xl py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <SacramentFormFields values={values} onChange={handleChange} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <FormActions
            onCancel={() => router.push('/sacramentos')}
            submitLabel="Criar Sacramento"
            submitting={createSacrament.isPending}
          />
        </form>
      </div>
    </>
  );
}
