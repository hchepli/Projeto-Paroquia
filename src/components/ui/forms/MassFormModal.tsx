// src/components/ui/forms/MassFormModal.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/modals/Modal';
import PastoralGroupsMultiSelect from '@/components/ui/inputs/PastoralGroupsMultiSelect';

export interface MassDto {
  id: number;
  title: string;
  dateTime: string; // ISO
  type: 'COMMON' | 'SPECIAL';
  location: string;
  notes?: string | null;
  generatedFromTemplateId?: number | null;
  // Shape real vindo do MassesService.findOne (include de MassPastoralGroup):
  // a FK é "pastoralGroupId", não "id" — o objeto em si não tem "id" próprio.
  pastoralGroups?: { pastoralGroupId: number; pastoralGroup?: { id: number; name: string } }[];
}

interface MassFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Quando presente, o modal abre em modo edição pré-preenchido. */
  mass?: MassDto | null;
}

const MASS_TYPES = [
  { value: 'COMMON', label: 'Comum' },
  { value: 'SPECIAL', label: 'Especial' },
];

const WEEKDAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

function toDateTimeLocalValue(iso: string) {
  // datetime-local espera "YYYY-MM-DDTHH:mm" em horário local, sem timezone.
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default function MassFormModal({ open, onClose, mass }: MassFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(mass);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('COMMON');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [pastoralGroupIds, setPastoralGroupIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [dateTime, setDateTime] = useState('');

  // Modo recorrente (MassTemplate) — só existe na criação (ver nota abaixo)
  const [recurring, setRecurring] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [time, setTime] = useState('19:00');

  // Pré-preenche ao abrir em modo edição (ou reseta ao abrir em modo criação)
  useEffect(() => {
    if (!open) return;

    if (mass) {
      setTitle(mass.title);
      setDateTime(toDateTimeLocalValue(mass.dateTime));
      setType(mass.type);
      setLocation(mass.location);
      setNotes(mass.notes ?? '');
      setPastoralGroupIds(
        (mass.pastoralGroups ?? [])
          .map((g) => g.pastoralGroupId)
          .filter((id): id is number => typeof id === 'number'),
      );
      setRecurring(false);
      setError(null);
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mass]);

  function resetForm() {
    setTitle('');
    setDateTime('');
    setType('COMMON');
    setLocation('');
    setNotes('');
    setPastoralGroupIds([]);
    setError(null);
    setRecurring(false);
    setDayOfWeek(1);
    setTime('19:00');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmitOnce() {
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
  }

  async function handleSubmitRecurring() {
    const response = await fetch('/api/mass-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dayOfWeek,
        time,
        title,
        location,
        type,
        notes: notes || undefined,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message ?? 'Erro ao criar missa recorrente.');
    }

    // As ocorrências físicas (Mass) só são geradas na próxima chamada de
    // GET /calendar (Bloco 5, Dia 2 - "pegar carona"). Invalidar a query do
    // calendário garante que, ao reabrir/recarregar a grade, as próximas
    // 8 semanas já apareçam.
    await queryClient.invalidateQueries({ queryKey: ['calendar'] });
  }

  async function handleSubmitEdit() {
    if (!mass) return;

    const response = await fetch(`/api/masses/${mass.id}`, {
      method: 'PATCH',
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
      throw new Error(body?.message ?? 'Erro ao atualizar missa.');
    }

    // Sincroniza vínculo de Pastorais. O backend faz "set" de verdade
    // (deleteMany + createMany em transação, ver MassesService.linkPastoralGroups)
    // — reenviar os mesmos IDs em toda edição é seguro, não duplica nem
    // estoura unique constraint. Array vazio também é válido (desvincula tudo).
    const linkResponse = await fetch(`/api/masses/${mass.id}/pastoral-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pastoralGroupIds }),
    });

    if (!linkResponse.ok) {
      throw new Error(
        'Missa atualizada, mas houve erro ao sincronizar as Pastorais. Tente novamente.',
      );
    }

    await queryClient.invalidateQueries({ queryKey: ['calendar'] });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title || !location) {
      setError('Preencha título e local.');
      return;
    }

    if (isEditing || !recurring) {
      if (!dateTime) {
        setError('Preencha data e hora.');
        return;
      }
    } else if (!time) {
      setError('Preencha o horário.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await handleSubmitEdit();
      } else if (recurring) {
        await handleSubmitRecurring();
      } else {
        await handleSubmitOnce();
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={isEditing ? 'Editar Missa' : 'Nova Missa'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isEditing && (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
            <label htmlFor="recurring-toggle" className="text-[13px] font-medium text-gray-700">
              Repetir semanalmente
            </label>
            <input
              id="recurring-toggle"
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="h-4 w-4 accent-[#1a4d8f]"
            />
          </div>
        )}

        {isEditing && mass?.generatedFromTemplateId && (
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-[12px] text-blue-800">
            Esta ocorrência foi gerada automaticamente a partir de uma Missa Recorrente. Editá-la
            aqui altera só esta data — a recorrência em si é gerenciada em{' '}
            <span className="font-medium">Missas Recorrentes</span>.
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
            placeholder="Missa Dominical"
          />
        </div>

        {!isEditing && recurring ? (
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[13px] font-medium text-gray-700">Dia da semana</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
              >
                {WEEKDAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[13px] font-medium text-gray-700">Horário</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-gray-700">Data e hora</label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
            />
          </div>
        )}

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
            Pastorais participantes {!isEditing && recurring ? '' : '(opcional, RN017)'}
          </label>
          <PastoralGroupsMultiSelect
            value={pastoralGroupIds}
            onChange={setPastoralGroupIds}
            disabled={!isEditing && recurring}
          />
          {!isEditing && recurring && (
            <p className="text-[12px] text-gray-500">
              Vínculo com Pastorais ainda não é suportado em missas recorrentes — edite cada
              ocorrência individualmente após ser gerada.
            </p>
          )}
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
            {submitting
              ? 'Salvando...'
              : isEditing
                ? 'Salvar Alterações'
                : recurring
                  ? 'Criar Recorrência'
                  : 'Criar Missa'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
