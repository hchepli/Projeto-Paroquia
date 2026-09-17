'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import TextInput from '@/components/ui/inputs/TextInput';
import TextareaInput from '@/components/ui/inputs/TextareaInput';
import SelectInput from '@/components/ui/inputs/SelectInput';
import FormActions from '@/components/ui/buttons/FormActions';
import { useCreateMass } from '@/hooks/masses/useCreateMass';
import { useLinkMassPastoralGroups } from '@/hooks/masses/useLinkMassPastoralGroups';
import { useCreateMassTemplate } from '@/hooks/mass-templates/useCreateMassTemplate';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';

const MASS_TYPES = [
  { value: 'COMMON', label: 'Comum' },
  { value: 'SPECIAL', label: 'Especial' },
];

const WEEKDAYS = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' },
];

export default function CriarMissaPage() {
  const router = useRouter();
  const createMass = useCreateMass();
  const linkPastoralGroups = useLinkMassPastoralGroups();
  const createMassTemplate = useCreateMassTemplate();
  const { data: pastoralGroups = [] } = usePastoralGroups();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('COMMON');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [selectedPastoralGroupIds, setSelectedPastoralGroupIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [recurring, setRecurring] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [time, setTime] = useState('19:00');

  function togglePastoralGroup(id: number) {
    setSelectedPastoralGroupIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !location.trim()) {
      setError('Título e local são obrigatórios.');
      return;
    }

    if (!recurring && !dateTime) {
      setError('Preencha data e hora.');
      return;
    }

    if (recurring && !time) {
      setError('Preencha o horário.');
      return;
    }

    try {
      if (recurring) {
        await createMassTemplate.mutateAsync({
          dayOfWeek: Number(dayOfWeek),
          time,
          title: title.trim(),
          location: location.trim(),
          type,
          notes: notes.trim() || undefined,
        });
        router.push('/calendario');
      } else {
        const mass = await createMass.mutateAsync({
          title: title.trim(),
          dateTime: new Date(dateTime).toISOString(),
          type,
          location: location.trim(),
          notes: notes.trim() || undefined,
        });

        if (selectedPastoralGroupIds.length > 0) {
          await linkPastoralGroups.mutateAsync({
            massId: mass.id,
            pastoralGroupIds: selectedPastoralGroupIds,
          });
        }

        router.push('/calendario');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    }
  }

  const submitting = createMass.isPending || createMassTemplate.isPending;

  return (
    <>
      <Header title="Nova Missa" description="Cadastre uma missa avulsa ou recorrente." onBack={() => router.back()} />

      <div className="py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border border-gray-300 px-4 py-3">
            <label htmlFor="recurring-toggle" className="text-sm font-medium text-gray-700">
              Repetir semanalmente
            </label>
            <input
              id="recurring-toggle"
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="h-4 w-4 accent-gray-700"
            />
          </div>

          <TextInput
            label="Título"
            value={title}
            onChange={setTitle}
            placeholder="Missa Dominical"
            required
          />

          {recurring ? (
            <div className="grid grid-cols-2 gap-4">
              <SelectInput
                label="Dia da semana"
                value={dayOfWeek}
                onChange={setDayOfWeek}
                placeholder="Selecione"
                options={WEEKDAYS}
                required
              />
              <TextInput label="Horário" type="time" value={time} onChange={setTime} required />
            </div>
          ) : (
            <TextInput
              label="Data e hora"
              type="datetime-local"
              value={dateTime}
              onChange={setDateTime}
              required
            />
          )}

          <SelectInput
            label="Tipo"
            value={type}
            onChange={setType}
            placeholder="Selecione"
            options={MASS_TYPES}
            required
          />

          <TextInput
            label="Local"
            value={location}
            onChange={setLocation}
            placeholder="Igreja Matriz"
            required
          />

          <TextareaInput label="Observações" value={notes} onChange={setNotes} rows={2} />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Pastorais participantes {recurring ? '' : '(opcional, RN017)'}
            </label>
            <div className="flex flex-wrap gap-2">
              {pastoralGroups.map((pg) => {
                const selected = selectedPastoralGroupIds.includes(pg.id);
                return (
                  <button
                    key={pg.id}
                    type="button"
                    disabled={recurring}
                    onClick={() => togglePastoralGroup(pg.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium disabled:opacity-40 ${
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
            {recurring && (
              <p className="mt-1 text-xs text-gray-500">
                Vínculo com Pastorais ainda não é suportado em missas recorrentes — edite cada
                ocorrência individualmente após ser gerada.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <FormActions
            onCancel={() => router.push('/calendario')}
            submitLabel={recurring ? 'Criar Recorrência' : 'Criar Missa'}
            submitting={submitting}
          />
        </form>
      </div>
    </>
  );
}