// src/components/ui/forms/RegisterScheduleModal.tsx
'use client';

import { FormEvent, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/modals/Modal';
import MassSearchCombobox from '@/components/ui/inputs/MassSearchCombobox';
import EventSearchCombobox from '@/components/ui/inputs/EventSearchCombobox';
import { useVolunteers } from '@/hooks/volunteers/useVolunteers';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';
import { CreateScheduleAssignmentInput } from '@/types/schedules/create-schedule';

interface RegisterScheduleModalProps {
  open: boolean;
  onClose: () => void;
}

type LinkType = 'mass' | 'event';

const ROLE_SUGGESTIONS = ['leitor', 'ministro_eucaristia', 'coroinha', 'apoio_organizacao'];

interface AssignmentRow {
  key: string; // só pra key do React, não vai no payload
  volunteerId: string;
  role: string;
}

function makeEmptyRow(): AssignmentRow {
  return { key: crypto.randomUUID(), volunteerId: '', role: '' };
}

export default function RegisterScheduleModal({ open, onClose }: RegisterScheduleModalProps) {
  const queryClient = useQueryClient();
  const { data: volunteers = [] } = useVolunteers();
  const { data: pastoralGroups = [] } = usePastoralGroups();

  const [linkType, setLinkType] = useState<LinkType>('mass');
  const [massId, setMassId] = useState('');
  const [eventId, setEventId] = useState('');
  const [rows, setRows] = useState<AssignmentRow[]>([makeEmptyRow()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // NOTA (Dia 3 do Bloco 1): o filtro do select de Voluntário pela Pastoral
  // vinculada à Missa/Evento depende do Bloco 3 (RN017 proposta), ainda
  // pendente. Enquanto isso, mostramos todos os voluntários (fallback
  // previsto no próprio roadmap) e aplicamos só o pré-preenchimento de
  // função via defaultRole da Pastoral do voluntário selecionado.

  function resetForm() {
    setLinkType('mass');
    setMassId('');
    setEventId('');
    setRows([makeEmptyRow()]);
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleLinkTypeChange(type: LinkType) {
    setLinkType(type);
    // RN007: trocar o tipo limpa a seleção do outro, pra nunca mandar os dois.
    setMassId('');
    setEventId('');
  }

  function addRow() {
    setRows((prev) => [...prev, makeEmptyRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  function updateRow(key: string, patch: Partial<AssignmentRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function handleVolunteerChange(key: string, volunteerId: string) {
    const volunteer = volunteers.find((v) => String(v.id) === volunteerId);
    const pastoralGroup = pastoralGroups.find((pg) => pg.id === volunteer?.pastoralGroupId);
    const suggestedRole = pastoralGroup?.defaultRole ?? '';

    // Pré-preenche a função com o defaultRole da Pastoral do voluntário,
    // mas continua editável manualmente depois (não trava o campo).
    updateRow(key, { volunteerId, role: suggestedRole });
  }

  function validate(): string | null {
    if (linkType === 'mass' && !massId) return 'Selecione uma Missa.';
    if (linkType === 'event' && !eventId) return 'Selecione um Evento.';

    const filledRows = rows.filter((r) => r.volunteerId && r.role.trim());
    if (filledRows.length === 0) {
      return 'Adicione pelo menos uma atribuição (Voluntário + Função), ou remova as linhas vazias antes de salvar.';
    }
    if (filledRows.length !== rows.length) {
      return 'Existem linhas de atribuição incompletas — preencha ou remova antes de salvar.';
    }

    const seen = new Set<string>();
    for (const r of filledRows) {
      const key = `${r.volunteerId}:${r.role.trim().toLowerCase()}`;
      if (seen.has(key)) {
        return 'Há um Voluntário duplicado na mesma função — cada combinação só pode aparecer uma vez.';
      }
      seen.add(key);
    }

    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const assignments: CreateScheduleAssignmentInput[] = rows.map((r) => ({
      volunteerId: Number(r.volunteerId),
      role: r.role.trim(),
    }));

    setSubmitting(true);
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          massId: linkType === 'mass' ? Number(massId) : undefined,
          eventId: linkType === 'event' ? Number(eventId) : undefined,
          assignments,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        if (response.status === 403) {
          throw new Error(
            body?.message ??
              'Sua Pastoral não está vinculada a esta Missa/Evento — você não pode criar Escala aqui.',
          );
        }
        throw new Error(body?.message ?? 'Erro ao registrar escala.');
      }

      await queryClient.invalidateQueries({ queryKey: ['schedules'] });
      await queryClient.invalidateQueries({ queryKey: ['schedules-summary'] });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar escala.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Registrar Escala">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Vincular a</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleLinkTypeChange('mass')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                linkType === 'mass'
                  ? 'border-[#701513] bg-[#701513]/5 text-[#701513]'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              Missa
            </button>
            <button
              type="button"
              onClick={() => handleLinkTypeChange('event')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                linkType === 'event'
                  ? 'border-[#701513] bg-[#701513]/5 text-[#701513]'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              Evento
            </button>
          </div>
        </div>

        {linkType === 'mass' ? (
          <MassSearchCombobox value={massId} onChange={setMassId} />
        ) : (
          <EventSearchCombobox value={eventId} onChange={setEventId} />
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-medium text-gray-700">Atribuições</label>
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1 text-xs font-medium text-[#1a4d8f] hover:underline"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>

          <datalist id="role-suggestions">
            {ROLE_SUGGESTIONS.map((role) => (
              <option key={role} value={role} />
            ))}
          </datalist>

          {rows.map((row) => (
            <div key={row.key} className="flex items-center gap-2">
              <select
                value={row.volunteerId}
                onChange={(e) => handleVolunteerChange(row.key, e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
              >
                <option value="">Selecione o Voluntário</option>
                {volunteers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>

              <input
                list="role-suggestions"
                value={row.role}
                onChange={(e) => updateRow(row.key, { role: e.target.value })}
                placeholder="Função (ex: leitor)"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
              />

              <button
                type="button"
                onClick={() => removeRow(row.key)}
                disabled={rows.length === 1}
                className="text-gray-400 hover:text-red-600 disabled:opacity-30"
                aria-label="Remover atribuição"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
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
            {submitting ? 'Salvando...' : 'Registrar Escala'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
