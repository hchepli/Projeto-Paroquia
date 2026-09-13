// src/components/ui/forms/EventFormModal.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/modals/Modal';
import MassSearchCombobox from '@/components/ui/inputs/MassSearchCombobox';
import PastoralGroupsMultiSelect from '@/components/ui/inputs/PastoralGroupsMultiSelect';

export interface EventDto {
  id: number;
  name: string;
  description?: string | null;
  startDate: string; // ISO
  endDate?: string | null;
  location: string;
  categoryId?: number | null;
  massId?: number | null;
  pastoralGroups?: { id: number }[]; // ASSUMIDO — confirmar shape real da API
}

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  event?: EventDto | null;
}

interface Category {
  id: number;
  name: string;
  type: 'EVENT' | 'ANNOUNCEMENT';
}

async function fetchCategories(): Promise<Category[]> {
  const response = await fetch('/api/categories');
  if (!response.ok) {
    throw new Error('Erro ao buscar categorias');
  }
  return response.json();
}

function toDateTimeLocalValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default function EventFormModal({ open, onClose, event }: EventFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(event);

  // ATENÇÃO: assumindo que GET /categories devolve array simples (igual /masses
  // devolvia antes da paginação), não paginado como /events. Se o backend
  // devolver { data, total, ... }, ajustar pra `categories?.data` aqui.
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    enabled: open,
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [massId, setMassId] = useState('');
  const [pastoralGroupIds, setPastoralGroupIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const eventCategories = (categories ?? []).filter((c) => c.type === 'EVENT');

  // Pré-preenche ao abrir em modo edição (ou reseta ao abrir em modo criação)
  useEffect(() => {
    if (!open) return;

    if (event) {
      setName(event.name);
      setDescription(event.description ?? '');
      setStartDate(toDateTimeLocalValue(event.startDate));
      setEndDate(event.endDate ? toDateTimeLocalValue(event.endDate) : '');
      setLocation(event.location);
      setCategoryId(event.categoryId ? String(event.categoryId) : '');
      setMassId(event.massId ? String(event.massId) : '');
      setPastoralGroupIds((event.pastoralGroups ?? []).map((g) => g.id));
      setError(null);
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event]);

  function resetForm() {
    setName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setLocation('');
    setCategoryId('');
    setMassId('');
    setPastoralGroupIds([]);
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function syncPastoralGroups(eventId: number) {
    // Não há endpoint PUT dedicado — usa o mesmo POST tanto na criação quanto
    // na edição. ATENÇÃO: isso só é seguro se o service do NestJS fizer "set"
    // (substitui a lista inteira) em vez de "connect" (só adiciona). Se for
    // "connect", reenviar os mesmos IDs em toda edição vai duplicar vínculo
    // ou estourar unique constraint — CONFIRMAR no backend.
    if (!isEditing && pastoralGroupIds.length === 0) return;

    const linkResponse = await fetch(`/api/events/${eventId}/pastoral-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pastoralGroupIds }),
    });

    if (!linkResponse.ok) {
      throw new Error(
        isEditing
          ? 'Evento atualizado, mas houve erro ao sincronizar as Pastorais. Tente novamente.'
          : 'Evento criado, mas houve erro ao vincular as Pastorais. Edite o evento para tentar novamente.',
      );
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !startDate || !location) {
      setError('Preencha nome, data de início e local.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        description: description || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        location,
        categoryId: categoryId ? Number(categoryId) : undefined,
        massId: massId ? Number(massId) : undefined,
      };

      const url = isEditing ? `/api/events/${event!.id}` : '/api/events';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.message ?? (isEditing ? 'Erro ao atualizar evento.' : 'Erro ao criar evento.'),
        );
      }

      const savedEvent = isEditing ? event! : await response.json();
      await syncPastoralGroups(savedEvent.id);

      await queryClient.invalidateQueries({ queryKey: ['calendar'] });
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={isEditing ? 'Editar Evento' : 'Novo Evento'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
            placeholder="Festa Junina"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Descrição (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
            rows={2}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-[13px] font-medium text-gray-700">Início</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-[13px] font-medium text-gray-700">Fim (opcional)</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Local</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
            placeholder="Salão Paroquial"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Categoria (opcional)</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
          >
            <option value="">Nenhuma</option>
            {eventCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">
            Vincular a uma Missa (opcional, RN002)
          </label>
          <MassSearchCombobox value={massId} onChange={setMassId} />
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
            {submitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Evento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}