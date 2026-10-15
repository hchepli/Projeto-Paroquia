// src/components/ui/forms/MassFormModal.tsx
'use client';

import { FormEvent, useState } from 'react';
import Modal from '@/components/ui/modals/Modal';
import MassFormFields from '@/components/ui/forms/MassFormFields';
import MassDeleteConfirm from '@/components/ui/forms/MassDeleteConfirm';
import { useMass } from '@/hooks/masses/useMass';
import { useUpdateMass } from '@/hooks/masses/useUpdateMass';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { ApiError, getErrorMessage } from '@/lib/errors';
import { toIsoWithOffset } from '@/lib/date/datetime';
import { MASS_TYPE_LABELS } from '@/lib/masses/constants';
import {
  MassFormValues,
  massToFormValues,
  validateMassForm,
} from '@/lib/masses/form';
import { MassDetail, MassType } from '@/types/masses/masses';

interface MassFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Id da Missa a editar/visualizar. O modal busca o detalhe sozinho. */
  massId: number | null;
}

export default function MassFormModal({ open, onClose, massId }: MassFormModalProps) {
  const { canManageMasses } = usePermissions();
  const { data: mass, isLoading, isError, error, refetch } = useMass(open ? massId : null);
  const [view, setView] = useState<'form' | 'delete'>('form');

  if (!open || massId === null) return null;

  function handleClose() {
    setView('form');
    onClose();
  }

  const title =
    view === 'delete'
      ? 'Remover Missa'
      : canManageMasses
        ? 'Editar Missa'
        : 'Detalhes da Missa';

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      {isLoading && <p className="text-sm text-gray-400">Carregando...</p>}

      {isError && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-red-600">{getErrorMessage(error, 'Erro ao buscar missa.')}</p>
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

      {mass && view === 'delete' && (
        <MassDeleteConfirm
          mass={mass}
          onCancel={() => setView('form')}
          onDeleted={handleClose}
        />
      )}

      {mass && view === 'form' && canManageMasses && (
        <MassEditForm
          key={mass.id}
          mass={mass}
          onClose={handleClose}
          onRequestDelete={() => setView('delete')}
        />
      )}

      {mass && view === 'form' && !canManageMasses && (
        <MassReadOnly mass={mass} onClose={handleClose} />
      )}
    </Modal>
  );
}

function MassEditForm({
  mass,
  onClose,
  onRequestDelete,
}: {
  mass: MassDetail;
  onClose: () => void;
  onRequestDelete: () => void;
}) {
  const updateMass = useUpdateMass();
  // Inicializa uma única vez por Missa (key={mass.id}): refetch em segundo plano
  // não sobrescreve o que o usuário já digitou.
  const [values, setValues] = useState<MassFormValues>(() => massToFormValues(mass));
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
      await updateMass.mutateAsync({
        id: mass.id,
        data: {
          title: values.title.trim(),
          dateTime: toIsoWithOffset(values.dateTime),
          type: values.type as MassType,
          location: values.location.trim(),
          notes: values.notes.trim(),
          pastoralGroupIds: values.pastoralGroupIds,
        },
      });
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(
          `${err.message} Remova a escala dessa Pastoral (página Escalas) antes de desvinculá-la.`,
        );
        return;
      }
      setError(getErrorMessage(err, 'Erro ao salvar missa.'));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <MassFormFields values={values} onChange={handleChange} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onRequestDelete}
          disabled={updateMass.isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Remover missa
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={updateMass.isPending}
            className="rounded-lg bg-[#1a4d8f] px-4 py-2 text-sm font-medium text-white hover:bg-[#153e73] disabled:opacity-50"
          >
            {updateMass.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </form>
  );
}

function MassReadOnly({ mass, onClose }: { mass: MassDetail; onClose: () => void }) {
  const when = new Date(mass.dateTime).toLocaleString('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
  const pastorals = (mass.pastoralGroups ?? []).map((g) => g.pastoralGroup?.name).filter(Boolean);

  return (
    <div className="flex flex-col gap-3 text-sm text-gray-700">
      <p className="text-base font-semibold">{mass.title}</p>
      <p>{when}</p>
      <p>
        {MASS_TYPE_LABELS[mass.type] ?? mass.type} · {mass.location}
      </p>
      {mass.notes && <p className="text-gray-500">{mass.notes}</p>}
      {pastorals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pastorals.map((name) => (
            <span key={name} className="rounded-full border border-gray-300 px-3 py-1 text-xs">
              {name}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
