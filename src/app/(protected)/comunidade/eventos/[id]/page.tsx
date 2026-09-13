// src/app/comunidade/eventos/[id]/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useEvent } from '@/hooks/events/useEvent';
import { useUpdateEvent } from '@/hooks/events/useUpdateEvent';
import { useLinkEventPastoralGroups } from '@/hooks/events/useLinkEventPastoralGroups';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';
import { useMasses } from '@/hooks/masses/useMasses';

function toDatetimeLocal(iso?: string | null) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
}

export default function EventoDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const eventId = Number(params.id);

  const { data: event, isLoading } = useEvent(eventId);
  const updateEvent = useUpdateEvent();
  const linkPastoralGroups = useLinkEventPastoralGroups();
  const { data: pastoralGroups = [] } = usePastoralGroups();
  const { data: massesResult } = useMasses({ limit: 100 });
  const masses = massesResult?.data ?? [];

  const [formInitialized, setFormInitialized] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [massId, setMassId] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'CANCELLED'>('ACTIVE');
  const [selectedPastoralGroupIds, setSelectedPastoralGroupIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (event && !formInitialized) {
    setName(event.name);
    setDescription(event.description ?? '');
    setStartDate(toDatetimeLocal(event.startDate));
    setEndDate(toDatetimeLocal(event.endDate));
    setLocation(event.location);
    setMassId(event.massId ? String(event.massId) : '');
    setStatus(event.status);
    // Agora que findOne inclui pastoralGroups, pré-marca o multi-select
    // com o que já está vinculado no banco.
    setSelectedPastoralGroupIds(event.pastoralGroups?.map((link) => link.pastoralGroupId) ?? []);
    setFormInitialized(true);
  }

  function togglePastoralGroup(id: number) {
    setSelectedPastoralGroupIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  }

  async function handleSave() {
    if (!name.trim() || !location.trim()) return;
    setError(null);

    try {
      await updateEvent.mutateAsync({
        id: eventId,
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        location: location.trim(),
        massId: massId ? Number(massId) : null,
        status,
      });

      await linkPastoralGroups.mutateAsync({
        eventId,
        pastoralGroupIds: selectedPastoralGroupIds,
      });

      router.push('/comunidade/eventos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar evento.');
    }
  }

  if (isLoading || !event) {
    return null;
  }

  return (
    <>
      <Header
        title={`Editar: ${event.name}`}
        description="Atualize os dados do evento."
        actions={[
          {
            label: 'Ver confirmações de presença',
            onClick: () => router.push(`/comunidade/eventos/${eventId}/confirmacoes`),
          },
          { label: 'Voltar para Eventos', onClick: () => router.push('/comunidade/eventos') },
        ]}
      />

      <div className="mt-6 max-w-lg space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Data/hora início</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Data/hora fim</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Local</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'CANCELLED')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400"
          >
            <option value="ACTIVE">Ativo</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Missa correlacionada</label>
          <select
            value={massId}
            onChange={(e) => setMassId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400"
          >
            <option value="">Nenhuma</option>
            {masses.map((mass) => (
              <option key={mass.id} value={mass.id}>
                {mass.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Pastorais participantes</label>
          <div className="flex flex-wrap gap-2">
            {pastoralGroups.map((pg) => {
              const selected = selectedPastoralGroupIds.includes(pg.id);
              return (
                <button
                  key={pg.id}
                  type="button"
                  onClick={() => togglePastoralGroup(pg.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    selected
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  {pg.name}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={updateEvent.isPending}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {updateEvent.isPending ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </>
  );
}