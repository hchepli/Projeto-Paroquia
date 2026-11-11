'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import FormActions from '@/components/ui/buttons/FormActions';
import MassFormFields from '@/components/ui/forms/MassFormFields';
import { useCreateMass } from '@/hooks/masses/useCreateMass';
import { useCreateMassTemplate } from '@/hooks/mass-templates/useCreateMassTemplate';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { ApiError, getErrorMessage } from '@/lib/errors';
import { toIsoWithOffset } from '@/lib/date/datetime';
import { EMPTY_MASS_FORM, MassFormValues, validateMassForm } from '@/lib/masses/form';
import { MassType } from '@/types/masses/masses';

function CriarMissaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canManageMasses, isLoading: loadingPermissions } = usePermissions();
  const createMass = useCreateMass();
  const createMassTemplate = useCreateMassTemplate();

  const [values, setValues] = useState<MassFormValues>({
    ...EMPTY_MASS_FORM,
    recurring: searchParams.get('recorrente') === '1',
  });
  const [error, setError] = useState<string | null>(null);

  function handleChange(patch: Partial<MassFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validation = validateMassForm(values);
    if (validation) {
      setError(validation);
      return;
    }

    try {
      if (values.recurring) {
        await createMassTemplate.mutateAsync({
          dayOfWeek: Number(values.dayOfWeek),
          time: values.time,
          title: values.title.trim(),
          location: values.location.trim(),
          type: values.type as MassType,
          notes: values.notes.trim() || undefined,
        });
      } else {
        await createMass.mutateAsync({
          title: values.title.trim(),
          dateTime: toIsoWithOffset(values.dateTime),
          type: values.type as MassType,
          location: values.location.trim(),
          notes: values.notes.trim() || undefined,
          pastoralGroupIds:
            values.pastoralGroupIds.length > 0 ? values.pastoralGroupIds : undefined,
        });
      }
      router.push('/calendario');
    } catch (err) {
      if (values.recurring && err instanceof ApiError && err.status === 409) {
        setError('Já existe uma missa recorrente nesse dia, horário e local.');
        return;
      }
      setError(getErrorMessage(err, 'Erro ao salvar.'));
    }
  }

  const submitting = createMass.isPending || createMassTemplate.isPending;

  if (!loadingPermissions && !canManageMasses) {
    return (
      <>
        <Header title="Nova Missa" description="Acesso restrito." onBack={() => router.back()} />
        <p className="py-6 text-sm text-gray-600">
          Seu cargo não tem permissão para cadastrar missas. Fale com a Secretaria.
        </p>
      </>
    );
  }

  return (
    <>
      <Header
        title="Nova Missa"
        description="Cadastre uma missa avulsa ou recorrente."
        onBack={() => router.back()}
      />

      <div className="py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border border-gray-300 px-4 py-3">
            <label htmlFor="recurring-toggle" className="text-sm font-medium text-gray-700">
              Repetir semanalmente
            </label>
            <input
              id="recurring-toggle"
              type="checkbox"
              checked={values.recurring}
              onChange={(e) =>
                handleChange({
                  recurring: e.target.checked,
                  pastoralGroupIds: e.target.checked ? [] : values.pastoralGroupIds,
                })
              }
              className="h-4 w-4 accent-gray-700"
            />
          </div>

          <MassFormFields values={values} onChange={handleChange} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <FormActions
            onCancel={() => router.push('/calendario')}
            submitLabel={values.recurring ? 'Criar Recorrência' : 'Criar Missa'}
            submitting={submitting || loadingPermissions}
          />
        </form>
      </div>
    </>
  );
}

// useSearchParams exige Suspense no build do Next.
export default function CriarMissaPage() {
  return (
    <Suspense fallback={null}>
      <CriarMissaForm />
    </Suspense>
  );
}
