'use client';

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { ROLE_NAMES } from '@/lib/constants/role-names';
import { CreateScheduleAssignmentInput } from '@/types/schedules/create-schedule';
import { ScheduleWarning } from '@/types/schedules/schedule';

type LinkType = 'MASS' | 'EVENT';

const ROLE_SUGGESTIONS = ['leitor', 'ministro da eucaristia', 'coroinha', 'apoio à organização'];

interface AssignmentRow {
  key: string;
  volunteerId: string;
  role: string;
}

interface FormError {
  message: string;
  existingScheduleId?: string;
}

const makeRow = (role = ''): AssignmentRow => ({ key: crypto.randomUUID(), volunteerId: '', role });

function formatOptionLabel(title: string, iso: string) {
  const d = new Date(iso);
  const time = d
    .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    .replace(':', 'h');
  return `${title} — ${d.toLocaleDateString('pt-BR')} às ${time}`;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export default function RegistrarEscalaPage() {
  return (
    <Suspense fallback={<p className="py-6 text-sm text-gray-500">Carregando...</p>}>
      <RegistrarEscalaForm />
    </Suspense>
  );
}

function RegistrarEscalaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialItem = searchParams.get('item'); // ex: "MASS:12" (vem do botão "Escalar")
  const createSchedule = useCreateSchedule();

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const isCoordenador = currentUser?.role?.name === ROLE_NAMES.COORDENADOR;
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
  const { data: pastoralGroups = [], isLoading: pastoralsLoading } = usePastoralGroups();

  const [linkType, setLinkType] = useState<LinkType>('MASS');
  const [selectedKey, setSelectedKey] = useState(''); // "MASS:12"
  const [pastoralId, setPastoralId] = useState<number | null>(null);
  const [rows, setRows] = useState<AssignmentRow[]>([makeRow()]);
  const [error, setError] = useState<FormError | null>(null);
  const [done, setDone] = useState<{ id: string; warnings: ScheduleWarning[] } | null>(null);
  const prefilled = useRef(false);

  const options = coverage.filter(
    (c) =>
      c.sourceType === linkType &&
      c.pastorals.some((p) => !p.scheduled && (!isCoordenador || p.id === ownPastoralId)),
  );
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
    setError(null);
    resetAssignments('');
  }

  function handleSelectSource(key: string) {
    setSelectedKey(key);
    setError(null);
    const item = coverage.find((c) => `${c.sourceType}:${c.sourceId}` === key);
    const missing = item?.pastorals.filter((p) => !p.scheduled) ?? [];
    const auto = missing.length === 1 ? missing[0].id : null; // falta só uma: já vem escolhida
    setPastoralId(auto);
    const roleFor = isCoordenador ? ownPastoralId : auto;
    resetAssignments(pastoralGroups.find((pg) => pg.id === roleFor)?.defaultRole ?? '');
  }

  function handleSelectPastoral(id: number) {
    setPastoralId(id);
    resetAssignments(pastoralGroups.find((pg) => pg.id === id)?.defaultRole ?? '');
  }

  // Atalho "Escalar" da lista: /escalas/registrar?item=MASS:12
  useEffect(() => {
    if (prefilled.current || !initialItem || userLoading || coverageLoading || pastoralsLoading) return;
    prefilled.current = true;
    const [type] = initialItem.split(':');
    if (type !== 'MASS' && type !== 'EVENT') return;
    setLinkType(type);
    if (coverage.some((c) => `${c.sourceType}:${c.sourceId}` === initialItem)) {
      handleSelectSource(initialItem);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItem, userLoading, coverageLoading, pastoralsLoading, coverage]);

  const updateRow = (key: string, patch: Partial<AssignmentRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeRow = (key: string) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));

  function validate(): string | null {
    if (!selected) return `Escolha ${linkType === 'MASS' ? 'uma missa' : 'um evento'}.`;
    if (!effectivePastoralId) return 'Escolha a pastoral que vai servir.';

    const target = selected.pastorals.find((p) => p.id === effectivePastoralId);
    if (!target) return 'Esta pastoral não participa desta missa ou evento. Escolha outra pastoral.';
    if (target.scheduled) return 'Esta pastoral já tem escala aqui. Escolha outra.';

    const filled = rows.filter((r) => r.volunteerId && r.role.trim());
    if (filled.length === 0) return 'Adicione pelo menos uma pessoa e a função dela.';
    if (filled.length !== rows.length) return 'Tem uma linha incompleta. Preencha ou apague antes de salvar.';

    const seen = new Set<string>();
    for (const r of filled) {
      const k = `${r.volunteerId}:${r.role.trim().toLowerCase().replace(/\s+/g, ' ')}`; // mesma normalização do back
      if (seen.has(k)) return 'A mesma pessoa não pode ter a mesma função duas vezes.';
      seen.add(k);
    }
    return null;
  }

  // Procura a escala que já existe (para o link no erro de "já existe")
  async function findExistingScheduleId(): Promise<string | undefined> {
    if (!selected || !effectivePastoralId) return undefined;
    try {
      const q = new URLSearchParams({
        limit: '1',
        pastoralGroupId: String(effectivePastoralId),
        [selected.sourceType === 'MASS' ? 'massId' : 'eventId']: String(selected.sourceId),
      });
      const res = await fetch(`/api/schedules?${q.toString()}`);
      if (!res.ok) return undefined;
      const body = await res.json();
      return body?.data?.[0]?.id as string | undefined;
    } catch {
      return undefined;
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) return setError({ message: validationError });

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
      if (created.warnings?.length) setDone({ id: created.id, warnings: created.warnings });
      else router.push('/escalas');
    } catch (err) {
      const existingScheduleId = await findExistingScheduleId();
      setError({
        message: existingScheduleId
          ? 'Esta pastoral já tem escala para esta missa ou evento.'
          : err instanceof Error && err.message
            ? err.message
            : 'Não foi possível salvar a escala. Tente de novo.',
        existingScheduleId,
      });
    }
  }

  if (done) {
    return (
      <>
        <Header title="Escala salva" onBack={() => router.push('/escalas')} />
        <div className="space-y-3 py-6">
          <p className="text-sm text-gray-700">A escala foi salva, mas confira estes horários:</p>
          {done.warnings.map((w) => (
            <p
              key={`${w.volunteerId}-${w.conflictsWith.scheduleId}`}
              className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800"
            >
              {w.volunteerName} também está escalado em “{w.conflictsWith.title}” ({fmt(w.conflictsWith.date)}).
            </p>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push(`/escalas/${done.id}`)}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
            >
              Ver a escala
            </button>
            <button
              type="button"
              onClick={() => router.push('/escalas')}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Ir para as escalas
            </button>
          </div>
        </div>
      </>
    );
  }

  if (userLoading || !currentUser) {
    return <p className="py-6 text-sm text-gray-500">Carregando...</p>;
  }

  if (isCoordenador && ownPastoralId == null) {
    return (
      <>
        <Header title="Registrar escala" onBack={() => router.push('/escalas')} />
        <p role="alert" className="py-6 text-sm text-red-600">
          Seu usuário ainda não está ligado a uma pastoral. Peça para o administrador ligar.
        </p>
      </>
    );
  }

  return (
    <>
      <Header
        title="Registrar escala"
        description="Escolha a missa ou o evento e diga quem vai servir."
        onBack={() => router.back()}
      />

      <div className="py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">A escala é para</label>
            <div className="flex gap-2">
              {(['MASS', 'EVENT'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={linkType === type}
                  onClick={() => handleLinkTypeChange(type)}
                  className={`flex-1 rounded-lg border px-3 py-3 text-sm font-medium transition ${
                    linkType === type ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {type === 'MASS' ? 'Uma missa' : 'Um evento'}
                </button>
              ))}
            </div>
          </div>

          {coverageLoading && <p className="text-sm text-gray-500">Carregando missas e eventos...</p>}
          {coverageError && (
            <p role="alert" className="text-sm text-red-600">
              Não foi possível carregar as missas e eventos. Atualize a página. Se continuar, avise a secretaria.
            </p>
          )}

          <ComboboxInput
            label={linkType === 'MASS' ? 'Missa' : 'Evento'}
            value={selectedKey}
            onChange={handleSelectSource}
            placeholder="Buscar por nome ou data..."
            emptyMessage={
              linkType === 'MASS'
                ? 'Nenhuma missa está esperando escala.'
                : 'Nenhum evento está esperando escala.'
            }
            required
            options={options.map((c) => ({
              value: `${c.sourceType}:${c.sourceId}`,
              label: formatOptionLabel(c.title, c.date),
            }))}
          />

          {selected && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {isCoordenador ? 'Sua pastoral' : 'Escolha a pastoral que vai servir'}
              </label>
              <div className="flex flex-wrap gap-2">
                {selected.pastorals.map((p) => {
                  const isSelected = effectivePastoralId === p.id;
                  const locked = p.scheduled || isCoordenador;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={locked}
                      aria-pressed={isSelected}
                      onClick={() => handleSelectPastoral(p.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        p.scheduled
                          ? 'border-green-300 bg-green-100 text-green-800'
                          : isSelected
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-red-300 bg-red-50 text-red-800 hover:bg-red-100'
                      } ${locked && !isSelected ? 'cursor-default' : ''}`}
                    >
                      {p.name} — {p.scheduled ? 'já escalada' : 'falta escalar'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selected && effectivePastoralId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Quem vai servir — {pastoral?.name}</label>
                <button
                  type="button"
                  onClick={() => setRows((prev) => [...prev, makeRow(defaultRole)])}
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:underline"
                >
                  <Plus size={14} /> Adicionar pessoa
                </button>
              </div>

              {defaultRole && (
                <p className="text-xs text-gray-500">
                  Função padrão desta pastoral: <strong>{defaultRole}</strong>. Você pode mudar.
                </p>
              )}

              <datalist id="role-suggestions">
                {ROLE_SUGGESTIONS.map((role) => (
                  <option key={role} value={role} />
                ))}
              </datalist>

              {volunteersLoading && <p className="text-sm text-gray-500">Carregando voluntários...</p>}
              {!volunteersLoading && pastoralVolunteers.length === 0 && (
                <p className="text-sm text-amber-700">
                  Esta pastoral ainda não tem voluntários. Cadastre os voluntários antes de escalar.
                </p>
              )}

              {rows.map((row) => (
                <div key={row.key} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <SelectInput
                      label="Voluntário"
                      hideLabel
                      value={row.volunteerId}
                      onChange={(value) => updateRow(row.key, { volunteerId: value })}
                      placeholder="Escolha a pessoa"
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
                    className="self-end text-gray-400 hover:text-red-600 disabled:opacity-30 sm:self-auto"
                    aria-label="Tirar esta pessoa da lista"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div role="alert" className="space-y-1 text-sm text-red-600">
              <p>{error.message}</p>
              {error.existingScheduleId && (
                <Link href={`/escalas/${error.existingScheduleId}`} className="font-medium underline">
                  Abrir a escala que já existe
                </Link>
              )}
            </div>
          )}

          <FormActions
            onCancel={() => router.push('/escalas')}
            submitLabel="Registrar escala"
            submitting={createSchedule.isPending}
          />
        </form>
      </div>
    </>
  );
}