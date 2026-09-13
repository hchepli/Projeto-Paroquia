'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import TextInput from '@/components/ui/inputs/TextInput';
import TextareaInput from '@/components/ui/inputs/TextareaInput';
import ComboboxInput from '@/components/ui/inputs/ComboboxInput';
import FormActions from '@/components/ui/buttons/FormActions';
import { formatMassOptionLabel } from '@/lib/date/formatMassOptionLabel';
import { useCreateEvent } from '@/hooks/events/useCreateEvent';
import { useLinkEventPastoralGroups } from '@/hooks/events/useLinkEventPastoralGroups';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';
import { useMasses } from '@/hooks/masses/useMasses';

export default function CriarEventoPage() {
  const router = useRouter();
  const createEvent = useCreateEvent();
  const linkPastoralGroups = useLinkEventPastoralGroups();
  const { data: pastoralGroups = [] } = usePastoralGroups();
  const { data: massesResult } = useMasses({ limit: 100 });
  const masses = massesResult?.data ?? [];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [massId, setMassId] = useState('');
  const [selectedPastoralGroupIds, setSelectedPastoralGroupIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  function togglePastoralGroup(id: number) {
    setSelectedPastoralGroupIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !startDate || !location.trim()) {
      setError('Nome, data de início e local são obrigatórios.');
      return;
    }

    try {
      const event = await createEvent.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        location: location.trim(),
        massId: massId ? Number(massId) : undefined,
      });

      if (selectedPastoralGroupIds.length > 0) {
        await linkPastoralGroups.mutateAsync({
          eventId: event.id,
          pastoralGroupIds: selectedPastoralGroupIds,
        });
      }

      router.push(`/comunidade/eventos/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar evento.');
    }
  }

  return (
    <>
      <Header title="Novo Evento" description="Cadastre um novo evento da paróquia." />

      <div className="py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <TextInput label="Nome" value={name} onChange={setName} required />

          <TextareaInput label="Descrição" value={description} onChange={setDescription} rows={3} />

          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Data/hora início"
              type="datetime-local"
              value={startDate}
              onChange={setStartDate}
              required
            />
            <TextInput
              label="Data/hora fim"
              type="datetime-local"
              value={endDate}
              onChange={setEndDate}
            />
          </div>

          <TextInput label="Local" value={location} onChange={setLocation} required />

          <ComboboxInput
            label="Missa correlacionada (RN002)"
            value={massId}
            onChange={setMassId}
            placeholder="Buscar por nome ou data..."
            emptyMessage="Nenhuma missa encontrada."
            options={masses.map((mass) => ({
              value: String(mass.id),
              label: formatMassOptionLabel(mass),
            }))}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Pastorais participantes (opcional — RN017 proposta)
            </label>
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <FormActions
            onCancel={() => router.push('/comunidade/eventos')}
            submitLabel="Criar Evento"
            submitting={createEvent.isPending}
          />
        </form>
      </div>
    </>
  );
}