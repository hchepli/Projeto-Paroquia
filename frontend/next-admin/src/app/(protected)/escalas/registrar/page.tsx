'use client';

import { useMemo, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import ComboboxInput from '@/components/ui/inputs/ComboboxInput';
import TextInput from '@/components/ui/inputs/TextInput';
import SelectInput from '@/components/ui/inputs/SelectInput';
import FormActions from '@/components/ui/buttons/FormActions';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { useCoverage } from '@/hooks/schedules/useCoverage';
import { useVolunteers } from '@/hooks/volunteers/useVolunteers';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';
import { useCreateSchedule } from '@/hooks/schedules/useCreateSchedule';
import { CreateScheduleAssignmentInput } from '@/types/schedules/create-schedule';
import { ScheduleWarning } from '@/types/schedules/schedule';

type LinkType = 'MASS' | 'EVENT';

const ROLE_SUGGESTIONS = ['leitor', 'ministro_eucaristia', 'coroinha', 'apoio_organizacao'];

interface AssignmentRow { key: string; volunteerId: string; role: string }

const makeRow = (role = ''): AssignmentRow => ({ key: crypto.randomUUID(), volunteerId: '', role });

function formatOptionLabel(title: string, iso: string) {
  const d = new Date(iso);
  return `${title} — ${d.toLocaleDateString('pt-BR')} ${d
    .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    .replace(':', 'h')}`;
}

export default function RegistrarEscalaPage() {
  const router = useRouter();
  const createSchedule = useCreateSchedule();

  const { data: currentUser } = useCurrentUser();
  const isCoordenador = currentUser?.role.name === 'Coordenador de Pastoral';
  const ownPastoralId = currentUser?.pastoralGroup?.id ?? null;

  // Janela fixa (useMemo evita mudar a queryKey a cada render): hoje até +6 meses
  const range = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 6);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, []);

  const { data: coverage = [], isLoading: coverageLoading, error: coverageError } = useCoverage(range);
  const { data: pastoralGroups = [] } = usePastoralGroups();

  const [linkType, setLinkType] = useState<LinkType>('MASS');
  const [selectedKey, setSelectedKey] = useState(''); // "MASS:12"
  const [pastoralId, setPastoralId] = useState<number | null>(null);
  const [rows, setRows] = useState<AssignmentRow[]>([makeRow()]);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<ScheduleWarning[] | null>(null); // não nulo = escala criada com avisos

  const options = coverage.filter((c) => c.sourceType === linkType && c.pastorals.some((p) => !p.scheduled));
  const selected = coverage.find((c) => `${c.sourceType}:${c.sourceId}` === selectedKey) ?? null;

  const effectivePastoralId = isCoordenador ? ownPastoralId : pastoralId;
  const pastoral = pastoralGroups.find((pg) => pg.id === effectivePastoralId);
  const defaultRole = pastoral?.defaultRole ?? '';

  // O back já filtra por pastoral (e o Coordenador só enxerga a própria); o filter é só cinto de segurança
  const { data: volunteers = [], isLoading: volunteersLoading } = useVolunteers({
    pastoralGroupId: effectivePastoralId ?? undefined,
  });
  const pastoralVolunteers = volunteers.filter((v) => v.pastoralGroupId === effectivePastoralId);

  const resetAssignments = (role: string) => setRows([makeRow(role)]);

  function handleLinkTypeChange(type: LinkType) {
    setLinkType(type);
    setSelectedKey('');
    setPastoralId(null);
    resetAssignments('');
  }

  function handleSelectSource(key: string) {
    setSelectedKey(key);
    const item = coverage.find((c) => `${c.sourceType}:${c.sourceId}` === key);
    const missing = item?.pastorals.filter((p) => !p.scheduled) ?? [];
    const auto = missing.length === 1 ? missing[0].id : null; // falta só uma: já vem selecionada
    setPastoralId(auto);
    const roleFor = isCoordenador ? ownPastoralId : auto;
    resetAssignments(pastoralGroups.find((pg) => pg.id === roleFor)?.defaultRole ?? '');
  }

  function handleSelectPastoral(id: number) {
    setPastoralId(id);
    resetAssignments(pastoralGroups.find((pg) => pg.id === id)?.defaultRole ?? '');
  }

  const updateRow = (key: string, patch: Partial<AssignmentRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeRow = (key: string) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));

  function validate(): string | null {
    if (!selected) return `Selecione ${linkType === 'MASS' ? 'uma Missa' : 'um Evento'}.`;
    if (!effectivePastoralId) return 'Selecione a Pastoral que será escalada.';

    const target = selected.pastorals.find((p) => p.id === effectivePastoralId);
    if (!target) return 'Esta Pastoral não está vinculada à Missa/Evento selecionado.';
    if (target.scheduled) return 'Esta Pastoral já possui escala para esta Missa/Evento.';

    const filled = rows.filter((r) => r.volunteerId && r.role.trim());
    if (filled.length === 0) return 'Adicione pelo menos uma atribuição (Voluntário + Função).';
    if (filled.length !== rows.length) return 'Existem linhas incompletas — preencha ou remova antes de salvar.';

    const seen = new Set<string>();
    for (const r of filled) {
      const k = `${r.volunteerId}:${r.role.trim().toLowerCase().replace(/\s+/g, ' ')}`; // mesma normalização do back
      if (seen.has(k)) return 'Há um Voluntário duplicado na mesma função.';
      seen.add(k);
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) return setError(validationError);

    const assignments: CreateScheduleAssignmentInput[] = rows.map((r) => ({
      volunteerId: Number(r.volunteerId),
      role: r.role.trim(),
    }));

    try {
      const created = await createSchedule.mutateAsync({
        massId: selected!.sourceType === 'MASS' ? selected!.sourceId : undefined,
        eventId: selected!.sourceType === 'EVENT' ? selected!.sourceId : undefined,
        pastoralGroupId: effectivePastoralId!,
        assignments,
      });
      if (created.warnings?.length) setWarnings(created.warnings); // mostra os avisos antes de sair
      else router.push('/escalas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar escala.');
    }
  }

  if (warnings) {
    return (
      <>
        <Header title="Escala registrada" onBack={() => router.push('/escalas')} />
        <div className="space-y-3 py-6">
          <p className="text-sm text-gray-700">A escala foi salva, mas há conflitos de horário para conferir:</p>
          {warnings.map((w) => (
            <p key={`${w.volunteerId}-${w.conflictsWith.scheduleId}`} className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              {w.volunteerName} também está escalado em “{w.conflictsWith.title}” (
              {new Date(w.conflictsWith.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}).
            </p>
          ))}
          <button
            type="button"
            onClick={() => router.push('/escalas')}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            Ir para Escalas
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Registrar Escala"
        description="Organize as atribuições de uma Missa ou Evento."
        onBack={() => router.back()}
      />

      <div className="py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Vincular a</label>
            <div className="flex gap-2">
              {(['MASS', 'EVENT'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleLinkTypeChange(type)}
                  className={`flex-1 rounded-lg border px-3 py-3 text-sm font-medium transition ${
                    linkType === type ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {type === 'MASS' ? 'Missa' : 'Evento'}
                </button>
              ))}
            </div>
          </div>

          {coverageLoading && <p className="text-sm text-gray-500">Carregando Missas e Eventos...</p>}
          {coverageError && <p className="text-sm text-red-600">{coverageError.message}</p>}

          <ComboboxInput
            label={linkType === 'MASS' ? 'Missa' : 'Evento'}
            value={selectedKey}
            onChange={handleSelectSource}
            placeholder="Buscar por nome ou data..."
            emptyMessage={linkType === 'MASS' ? 'Nenhuma missa com escala pendente.' : 'Nenhum evento com escala pendente.'}
            required
            options={options.map((c) => ({ value: `${c.sourceType}:${c.sourceId}`, label: formatOptionLabel(c.title, c.date) }))}
          />

          {selected && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Pastorais vinculadas</label>
              <div className="flex flex-wrap gap-2">
                {selected.pastorals.map((p) => {
                  const isSelected = effectivePastoralId === p.id;
                  const locked = p.scheduled || isCoordenador;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={locked}
                      onClick={() => handleSelectPastoral(p.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        p.scheduled
                          ? 'border-green-300 bg-green-100 text-green-800'
                          : isSelected
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-red-300 bg-red-50 text-red-800 hover:bg-red-100'
                      } ${locked && !isSelected ? 'cursor-default' : ''}`}
                    >
                      {p.scheduled ? '✓' : '!'} {p.name}
                      {p.scheduled ? ' (escalada)' : ' (pendente)'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selected && effectivePastoralId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Atribuições — {pastoral?.name}</label>
                <button
                  type="button"
                  onClick={() => setRows((prev) => [...prev, makeRow(defaultRole)])}
                  className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:underline"
                >
                  <Plus size={14} /> Adicionar
                </button>
              </div>

              <datalist id="role-suggestions">
                {ROLE_SUGGESTIONS.map((role) => (<option key={role} value={role} />))}
              </datalist>

              {volunteersLoading && <p className="text-sm text-gray-500">Carregando voluntários...</p>}
              {!volunteersLoading && pastoralVolunteers.length === 0 && (
                <p className="text-sm text-amber-700">Esta Pastoral ainda não tem voluntários cadastrados.</p>
              )}

              {rows.map((row) => (
                <div key={row.key} className="flex items-center gap-2">
                  <div className="flex-1">
                    <SelectInput
                      label="Voluntário"
                      hideLabel
                      value={row.volunteerId}
                      onChange={(value) => updateRow(row.key, { volunteerId: value })}
                      placeholder="Selecione o Voluntário"
                      options={pastoralVolunteers.map((v) => ({ value: String(v.id), label: v.name }))}
                    />
                  </div>
                  <div className="flex-1">
                    <TextInput
                      label="Função"
                      hideLabel
                      list="role-suggestions"
                      value={row.role}
                      onChange={(value) => updateRow(row.key, { role: value })}
                      placeholder="Função (ex: leitor)"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    disabled={rows.length === 1}
                    className="text-gray-400 hover:text-red-600 disabled:opacity-30"
                    aria-label="Remover atribuição"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <FormActions onCancel={() => router.push('/escalas')} submitLabel="Registrar Escala" submitting={createSchedule.isPending} />
        </form>
      </div>
    </>
  );
}