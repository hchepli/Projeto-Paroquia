'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import SacramentFormFields from '@/components/ui/forms/SacramentFormFields';
import ConfirmDialog from '@/components/ui/forms/ConfirmDialog';
import FormActions from '@/components/ui/buttons/FormActions';
import { useSacrament } from '@/hooks/sacraments/useSacrament';
import { useUpdateSacrament } from '@/hooks/sacraments/useUpdateSacrament';
import { useDeleteSacrament } from '@/hooks/sacraments/useDeleteSacrament';
import { usePermissions } from '@/hooks/auth/usePermissions';
import {
  getSacramentDeleteError,
  getSacramentLoadError,
  getSacramentSaveError,
} from '@/lib/sacraments/errors';
import {
  buildSacramentPayload,
  SacramentFormValues,
  sacramentToFormValues,
  validateSacramentForm,
} from '@/lib/sacraments/form';
import { Sacrament } from '@/types/sacraments/sacraments';

function DetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const wantsEdit = searchParams.get('edit') === '1';
  const sacramentId = Number(params.id);

  const { canManageSacraments, isLoading: permLoading } = usePermissions();
  const { data: sacrament, isLoading, isError, error, refetch } = useSacrament(sacramentId);

  if (isLoading || permLoading) {
    return <p className="mt-8 text-base text-gray-500">Carregando sacramento...</p>;
  }

  if (isError || !sacrament) {
    return (
      <>
        <Header title="Sacramento" description="" onBack={() => router.push('/sacramentos')} />
        <div role="alert" className="mt-8 rounded-md bg-red-50 px-3 py-2 text-base text-red-700">
          {getSacramentLoadError(error)}{' '}
          <button type="button" onClick={() => refetch()} className="font-medium underline">
            Tentar de novo
          </button>
        </div>
      </>
    );
  }

  const editing = wantsEdit && canManageSacraments;

  return (
    <>
      <Header
        title={editing ? `Editar: ${sacrament.name}` : sacrament.name}
        description={
          editing
            ? 'Mude o que for preciso e clique em "Salvar alterações".'
            : 'Assim as pessoas veem este sacramento no site.'
        }
        actions={
          canManageSacraments && !editing
            ? [
                {
                  label: 'Editar',
                  onClick: () => router.replace(`/sacramentos/${sacrament.id}?edit=1`),
                },
              ]
            : []
        }
        onBack={() => router.push('/sacramentos')}
      />

      {wantsEdit && !canManageSacraments && (
        <p role="alert" className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-base text-amber-800">
          Você só pode ver este sacramento. Apenas o Admin Geral e a Secretaria podem editar.
        </p>
      )}

      {editing ? (
        <SacramentEditForm key={`${sacrament.id}-${sacrament.updatedAt}`} sacrament={sacrament} />
      ) : (
        <SacramentView sacrament={sacrament} />
      )}
    </>
  );
}

function SacramentView({ sacrament }: { sacrament: Sacrament }) {
  const faq = sacrament.faq ?? [];
  return (
    <div className="mt-6 space-y-6 text-base text-gray-800">
      <section>
        <h2 className="mb-1 text-lg font-semibold">O que é</h2>
        <p className="whitespace-pre-line">{sacrament.description}</p>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Documentos necessários</h2>
        {sacrament.requiredDocuments?.trim() ? (
          <p className="whitespace-pre-line">{sacrament.requiredDocuments}</p>
        ) : (
          <p className="text-gray-500">Nenhum documento informado.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Perguntas frequentes</h2>
        {faq.length === 0 ? (
          <p className="text-gray-500">Nenhuma pergunta cadastrada.</p>
        ) : (
          <ul className="space-y-3">
            {faq.map((item, i) => (
              <li key={i} className="rounded-md border border-gray-200 p-3">
                <p className="font-medium">{item.question}</p>
                <p className="mt-1 whitespace-pre-line text-gray-700">{item.answer}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SacramentEditForm({ sacrament }: { sacrament: Sacrament }) {
  const router = useRouter();
  const updateSacrament = useUpdateSacrament();
  const deleteSacrament = useDeleteSacrament();

  // Inicializa uma vez por versão (updatedAt): refetch em segundo plano
  // não sobrescreve o que a pessoa está digitando.
  const [values, setValues] = useState<SacramentFormValues>(() => sacramentToFormValues(sacrament));
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      await updateSacrament.mutateAsync({
        id: sacrament.id,
        ...buildSacramentPayload(values, 'edit'),
      });
      router.push('/sacramentos');
    } catch (err) {
      setError(getSacramentSaveError(err));
    }
  }

  async function confirmDelete() {
    setDeleteError(null);
    try {
      await deleteSacrament.mutateAsync(sacrament.id);
      router.push('/sacramentos');
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 404) {
        router.push('/sacramentos'); // já removido: volta para a lista
      } else {
        setDeleteError(getSacramentDeleteError(err));
      }
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <SacramentFormFields values={values} onChange={handleChange} />

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-base text-red-700">
            {error}
          </p>
        )}

        <FormActions
          onCancel={() => router.push('/sacramentos')}
          submitLabel="Salvar alterações"
          submitting={updateSacrament.isPending}
        />
      </form>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => {
            setDeleteError(null);
            setDeleteOpen(true);
          }}
          className="rounded-md px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50"
        >
          Remover este sacramento
        </button>
      </div>

      {deleteOpen && (
        <ConfirmDialog
          title="Remover sacramento"
          message={`Remover "${sacrament.name}"? Ele deixa de aparecer no site e isso não pode ser desfeito.`}
          confirmLabel="Remover"
          loadingLabel="Removendo..."
          danger
          isLoading={deleteSacrament.isPending}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </>
  );
}

export default function SacramentoDetailPage() {
  return (
    <Suspense fallback={<p className="mt-8 text-base text-gray-500">Carregando...</p>}>
      <DetailContent />
    </Suspense>
  );
}