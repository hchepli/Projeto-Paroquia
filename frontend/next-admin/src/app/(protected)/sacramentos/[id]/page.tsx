// src/app/(protected)/sacramentos/[id]/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import SacramentFormFields from '@/components/ui/forms/SacramentFormFields';
import SacramentDeleteDialog from '@/components/ui/forms/SacramentDeleteDialog';
import { useSacrament } from '@/hooks/sacraments/useSacrament';
import { useUpdateSacrament } from '@/hooks/sacraments/useUpdateSacrament';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { getFriendlyErrorMessage } from '@/lib/errors';
import {
  buildSacramentPayload,
  getSacramentSaveError,
  SacramentFormValues,
  sacramentToFormValues,
  validateSacramentForm,
} from '@/lib/sacraments/form';
import { Sacrament } from '@/types/sacraments/sacraments';

export default function SacramentoDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sacramentId = Number(params.id);

  const { canManageSacraments, isLoading: permLoading } = usePermissions();
  const { data: sacrament, isLoading, isError, error, refetch } = useSacrament(sacramentId);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading || permLoading) {
    return <p className="mt-8 text-sm text-gray-400">Carregando sacramento...</p>;
  }

  if (isError || !sacrament) {
    return (
      <>
        <Header title="Sacramento" description="" onBack={() => router.push('/sacramentos')} />
        <p className="mt-8 text-sm text-red-600">
          {getFriendlyErrorMessage(error, 'Erro ao buscar sacramento.')}{' '}
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
        title={`${canManageSacraments ? 'Editar' : 'Sacramento'}: ${sacrament.name}`}
        description={
          canManageSacraments
            ? 'Atualize os dados do sacramento.'
            : 'Visualização somente leitura.'
        }
        actions={[{ label: 'Voltar para Sacramentos', onClick: () => router.push('/sacramentos') }]}
        onBack={() => router.back()}
      />

      <SacramentEditForm
        key={`${sacrament.id}-${sacrament.updatedAt}`}
        sacrament={sacrament}
        readOnly={!canManageSacraments}
        onRequestDelete={() => setDeleteOpen(true)}
      />

      {deleteOpen && (
        <SacramentDeleteDialog
          sacrament={sacrament}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => router.push('/sacramentos')}
        />
      )}
    </>
  );
}

function SacramentEditForm({
  sacrament,
  readOnly,
  onRequestDelete,
}: {
  sacrament: Sacrament;
  readOnly: boolean;
  onRequestDelete: () => void;
}) {
  const router = useRouter();
  const updateSacrament = useUpdateSacrament();
  // Inicializa uma vez por versão (updatedAt): refetch em segundo plano não
  // sobrescreve o que o usuário está digitando.
  const [values, setValues] = useState<SacramentFormValues>(() =>
    sacramentToFormValues(sacrament),
  );
  const [error, setError] = useState<string | null>(null);

  function handleChange(patch: Partial<SacramentFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setError(null);

    const validation = validateSacramentForm(values);
    if (validation) {
      setError(validation);
      return;
    }

    try {
      await updateSacrament.mutateAsync({
        id: sacrament.id,
        ...buildSacramentPayload(values, 'edit'),
      });
      router.push('/sacramentos');
    } catch (err) {
      setError(getSacramentSaveError(err, 'Erro ao salvar sacramento.'));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
      <SacramentFormFields values={values} onChange={handleChange} readOnly={readOnly} />

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {!readOnly && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onRequestDelete}
            className="rounded-md px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Remover sacramento
          </button>
          <button
            type="submit"
            disabled={updateSacrament.isPending}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {updateSacrament.isPending ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      )}
    </form>
  );
}
