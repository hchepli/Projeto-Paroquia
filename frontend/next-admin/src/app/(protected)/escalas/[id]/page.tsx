'use client';

import { FormEvent, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import SelectInput from '@/components/ui/inputs/SelectInput';
import TextInput from '@/components/ui/inputs/TextInput';
import { useSchedule } from '@/hooks/schedules/useSchedule';
import { useAddAssignment, useDeleteSchedule, useRemoveAssignment } from '@/hooks/schedules/useScheduleMutations';
import { useVolunteers } from '@/hooks/volunteers/useVolunteers';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';
import { ScheduleWarning } from '@/types/schedules/schedule';

const ROLE_SUGGESTIONS = ['leitor', 'ministro da eucaristia', 'coroinha', 'apoio à organização'];

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export default function EscalaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: schedule, isLoading, error } = useSchedule(id);
  const { data: volunteers = [] } = useVolunteers({ pastoralGroupId: schedule?.pastoralGroupId });
  const { data: pastoralGroups = [] } = usePastoralGroups();
  const addAssignment = useAddAssignment();
  const removeAssignment = useRemoveAssignment();
  const deleteSchedule = useDeleteSchedule();

  const [volunteerId, setVolunteerId] = useState('');
  const [role, setRole] = useState<string | null>(null); // null = usar a função padrão da pastoral
  const [message, setMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<ScheduleWarning[]>([]);

  if (isLoading) return <p className="py-6 text-sm text-gray-500">Carregando escala...</p>;
  if (error || !schedule) {
    return (
      <>
        <Header title="Escala" onBack={() => router.push('/escalas')} />
        <div role="alert" className="space-y-1 py-6 text-sm text-red-600">
          <p>{error?.message ?? 'Não encontramos esta escala.'}</p>
          <p className="text-gray-600">
            Se a missa ou o evento foi apagado, a escala dele também some.
          </p>
        </div>
      </>
    );
  }

  const title = schedule.mass?.title ?? schedule.event?.name ?? 'Escala';
  const when = schedule.mass?.dateTime ?? schedule.event?.startDate;
  const cancelled = schedule.event?.status === 'CANCELLED';
  const pastoralVolunteers = volunteers.filter((v) => v.pastoralGroupId === schedule.pastoralGroupId);
  const defaultRole = pastoralGroups.find((pg) => pg.id === schedule.pastoralGroupId)?.defaultRole ?? '';
  const roleValue = role ?? defaultRole;
  const onlyOne = schedule.assignments.length <= 1;

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setWarnings([]);
    if (!volunteerId || !roleValue.trim()) return setMessage('Escolha a pessoa e escreva a função.');
    try {
      const res = await addAssignment.mutateAsync({
        scheduleId: id,
        volunteerId: Number(volunteerId),
        role: roleValue.trim(),
      });
      setWarnings(res.warnings ?? []);
      setVolunteerId('');
      setRole(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível adicionar. Tente de novo.');
    }
  }

  async function handleRemoveAssignment(assignmentId: number, name: string, assignmentRole: string) {
    if (!window.confirm(`Tirar ${name} (${assignmentRole}) desta escala?`)) return;
    setMessage(null);
    try {
      await removeAssignment.mutateAsync(assignmentId);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível tirar a pessoa. Tente de novo.');
    }
  }

  async function handleDeleteSchedule() {
    const n = schedule!.assignments.length;
    const people = n === 1 ? '1 pessoa será tirada' : `${n} pessoas serão tiradas`;
    if (
      !window.confirm(
        `Remover a escala de "${schedule!.pastoralGroup?.name ?? ''}" em "${title}"?\n\n${people} da escala. Isso não pode ser desfeito.`,
      )
    )
      return;
    setMessage(null);
    try {
      await deleteSchedule.mutateAsync(id);
      router.push('/escalas');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível remover a escala. Tente de novo.');
    }
  }

  return (
    <>
      <Header
        title={`${title} — ${schedule.pastoralGroup?.name ?? ''}`}
        description={when ? fmt(when) : undefined}
        onBack={() => router.push('/escalas')}
        actions={[{ label: 'Remover escala', onClick: handleDeleteSchedule }]}
      />

      <div className="space-y-6 py-6">
        {cancelled && (
          <p className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            Este evento foi cancelado. Só é possível remover a escala.
          </p>
        )}
        {message && (
          <p role="alert" className="text-sm text-red-600">
            {message}
          </p>
        )}
        {warnings.map((w) => (
          <p
            key={`${w.volunteerId}-${w.conflictsWith.scheduleId}`}
            className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800"
          >
            Atenção: {w.volunteerName} também está escalado em “{w.conflictsWith.title}” ({fmt(w.conflictsWith.date)}).
          </p>
        ))}

        <ul className="divide-y rounded-[16px] border border-[rgba(0,0,0,0.3)]">
          {schedule.assignments.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>
                {a.volunteer.name} — <strong>{a.role}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleRemoveAssignment(a.id, a.volunteer.name, a.role)}
                disabled={cancelled || onlyOne || removeAssignment.isPending}
                className="text-gray-400 hover:text-red-600 disabled:opacity-30"
                aria-label={`Tirar ${a.volunteer.name} da escala`}
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
        {onlyOne && !cancelled && (
          <p className="text-xs text-gray-500">
            Uma escala precisa ter pelo menos uma pessoa. Para esvaziar, use “Remover escala”.
          </p>
        )}

        {!cancelled && (
          <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <datalist id="role-suggestions">
              {ROLE_SUGGESTIONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            <div className="flex-1">
              <SelectInput
                label="Voluntário"
                value={volunteerId}
                onChange={setVolunteerId}
                placeholder="Escolha a pessoa"
                options={pastoralVolunteers.map((v) => ({ value: String(v.id), label: v.name }))}
              />
            </div>
            <div className="flex-1">
              <TextInput
                label={defaultRole ? `Função (padrão: ${defaultRole})` : 'Função'}
                list="role-suggestions"
                value={roleValue}
                onChange={setRole}
                placeholder="Função (ex: leitor)"
              />
            </div>
            <button
              type="submit"
              disabled={addAssignment.isPending}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {addAssignment.isPending ? 'Adicionando...' : 'Adicionar pessoa'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}