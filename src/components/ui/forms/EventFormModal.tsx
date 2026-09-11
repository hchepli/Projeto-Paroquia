// src/components/ui/forms/EventFormModal.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/modals/Modal';
import MassSearchCombobox from '@/components/ui/inputs/MassSearchCombobox';
import PastoralGroupsMultiSelect from '@/components/ui/inputs/PastoralGroupsMultiSelect';

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
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

export default function EventFormModal({ open, onClose }: EventFormModalProps) {
  const queryClient = useQueryClient();

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !startDate || !location) {
      setError('Preencha nome, data de início e local.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          location,
          categoryId: categoryId ? Number(categoryId) : undefined,
          massId: massId ? Number(massId) : undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? 'Erro ao criar evento.');
      }

      const createdEvent = await response.json();

      // RN017 (proposta): vínculo com Pastorais é um request separado do create,
      // igual já é feito no backend (POST /events/:id/pastoral-groups).
      // Evento já foi criado com sucesso nesse ponto — se este segundo request
      // falhar, não desfazemos o Evento; só avisamos que o vínculo não foi salvo,
      // pra evitar duplicar o registro caso o usuário tente de novo.
      if (pastoralGroupIds.length > 0) {
        const linkResponse = await fetch(`/api/events/${createdEvent.id}/pastoral-groups`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pastoralGroupIds }),
        });

        if (!linkResponse.ok) {
          throw new Error(
            'Evento criado, mas houve erro ao vincular as Pastorais. Edite o evento para tentar novamente.',
          );
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['calendar'] });
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar evento.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Novo Evento">
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
            {submitting ? 'Salvando...' : 'Criar Evento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
