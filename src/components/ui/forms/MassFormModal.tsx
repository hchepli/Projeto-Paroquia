// src/components/ui/forms/MassFormModal.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/modals/Modal';
import PastoralGroupsMultiSelect from '@/components/ui/inputs/PastoralGroupsMultiSelect';

interface MassFormModalProps {
  open: boolean;
  onClose: () => void;
}

const MASS_TYPES = [
  { value: 'COMMON', label: 'Comum' },
  { value: 'SPECIAL', label: 'Especial' },
];

export default function MassFormModal({ open, onClose }: MassFormModalProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [type, setType] = useState('COMMON');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [pastoralGroupIds, setPastoralGroupIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setTitle('');
    setDateTime('');
    setType('COMMON');
    setLocation('');
    setNotes('');
    setPastoralGroupIds([]);
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title || !dateTime || !location) {
      setError('Preencha título, data/hora e local.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/masses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          dateTime: new Date(dateTime).toISOString(),
          type,
          location,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? 'Erro ao criar missa.');
      }

      const createdMass = await response.json();

      // RN017 (proposta): vínculo com Pastorais é um request separado do create,
      // igual já é feito no backend (POST /masses/:id/pastoral-groups).
      // Missa já foi criada com sucesso nesse ponto — se este segundo request
      // falhar, não desfazemos a Missa; só avisamos que o vínculo não foi salvo.
      if (pastoralGroupIds.length > 0) {
        const linkResponse = await fetch(`/api/masses/${createdMass.id}/pastoral-groups`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pastoralGroupIds }),
        });

        if (!linkResponse.ok) {
          throw new Error(
            'Missa criada, mas houve erro ao vincular as Pastorais. Edite a missa para tentar novamente.',
          );
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['calendar'] });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar missa.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nova Missa">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
            placeholder="Missa Dominical"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Data e hora</label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
          >
            {MASS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Local</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
            placeholder="Igreja Matriz"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Observações (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
            rows={2}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">
            Pastorais participantes (opcional, RN017)
          </label>
          <PastoralGroupsMultiSelect value={pastoralGroupIds} onChange={setPastoralGroupIds} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#1a4d8f] px-4 py-2 text-sm font-medium text-white hover:bg-[#153e73] disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Criar Missa'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
