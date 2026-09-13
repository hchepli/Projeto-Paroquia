'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import ComboboxInput from '@/components/ui/inputs/ComboboxInput';
import TextInput from '@/components/ui/inputs/TextInput';
import SelectInput from '@/components/ui/inputs/SelectInput';
import FormActions from '@/components/ui/buttons/FormActions';
import { formatMassOptionLabel } from '@/lib/date/formatMassOptionLabel';
import { formatEventOptionLabel } from '@/lib/date/formatEventOptionLabel';
import { useMasses } from '@/hooks/masses/useMasses';
import { useEvents } from '@/hooks/events/useEvents';
import { useVolunteers } from '@/hooks/volunteers/useVolunteers';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';
import { useCreateSchedule } from '@/hooks/schedules/useCreateSchedule';
import { CreateScheduleAssignmentInput } from '@/types/schedules/create-schedule';

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

export default function CriarEscalaPage() {
    const router = useRouter();
    const createSchedule = useCreateSchedule();

    const { data: massesResult } = useMasses({ limit: 100 });
    const masses = massesResult?.data ?? [];
    const { data: eventsResult } = useEvents({ limit: 100 });
    const events = eventsResult?.data ?? [];
    const { data: volunteers = [] } = useVolunteers();
    const { data: pastoralGroups = [] } = usePastoralGroups();

    const [linkType, setLinkType] = useState<LinkType>('mass');
    const [massId, setMassId] = useState('');
    const [eventId, setEventId] = useState('');
    const [rows, setRows] = useState<AssignmentRow[]>([makeEmptyRow()]);
    const [error, setError] = useState<string | null>(null);

    // NOTA (Dia 3 do Bloco 1): filtro de Voluntário pela Pastoral vinculada à
    // Missa/Evento depende do Bloco 3 (RN017 proposta), ainda pendente.
    // Enquanto isso, mostramos todos os voluntários (fallback previsto no
    // roadmap) e só pré-preenchemos a função via defaultRole.

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

        try {
            await createSchedule.mutateAsync({
                massId: linkType === 'mass' ? Number(massId) : undefined,
                eventId: linkType === 'event' ? Number(eventId) : undefined,
                assignments,
            });

            router.push('/escalas');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao registrar escala.');
        }
    }

    return (
        <>
            <Header title="Registrar Escala" description="Organize as atribuições de uma Missa ou Evento." />

            <div className="py-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Vincular a</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleLinkTypeChange('mass')}
                                className={`flex-1 rounded-lg border px-3 py-3 text-sm font-medium transition ${linkType === 'mass'
                                        ? 'border-gray-900 bg-gray-900 text-white'
                                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Missa
                            </button>
                            <button
                                type="button"
                                onClick={() => handleLinkTypeChange('event')}
                                className={`flex-1 rounded-lg border px-3 py-3 text-sm font-medium transition ${linkType === 'event'
                                        ? 'border-gray-900 bg-gray-900 text-white'
                                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Evento
                            </button>
                        </div>
                    </div>

                    {linkType === 'mass' ? (
                        <ComboboxInput
                            label="Missa"
                            value={massId}
                            onChange={setMassId}
                            placeholder="Buscar por nome ou data..."
                            emptyMessage="Nenhuma missa encontrada."
                            required
                            options={masses.map((mass) => ({
                                value: String(mass.id),
                                label: formatMassOptionLabel(mass),
                            }))}
                        />
                    ) : (
                        <ComboboxInput
                            label="Evento"
                            value={eventId}
                            onChange={setEventId}
                            placeholder="Buscar por nome ou data..."
                            emptyMessage="Nenhum evento encontrado."
                            required
                            options={events.map((event) => ({
                                value: String(event.id),
                                label: formatEventOptionLabel(event),
                            }))}
                        />
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Atribuições</label>
                            <button
                                type="button"
                                onClick={addRow}
                                className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:underline"
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
                                <div className="flex-1">
                                    <SelectInput
                                        label="Voluntário"
                                        hideLabel
                                        value={row.volunteerId}
                                        onChange={(value) => handleVolunteerChange(row.key, value)}
                                        placeholder="Selecione o Voluntário"
                                        options={volunteers.map((v) => ({ value: String(v.id), label: v.name }))}
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

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <FormActions
                        onCancel={() => router.push('/escalas')}
                        submitLabel="Registrar Escala"
                        submitting={createSchedule.isPending}
                    />
                </form>
            </div>
        </>
    );
}