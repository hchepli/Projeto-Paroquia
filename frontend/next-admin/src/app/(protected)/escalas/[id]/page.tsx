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
import { ScheduleWarning } from '@/types/schedules/schedule';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export default function EscalaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: schedule, isLoading, error } = useSchedule(id);
  const { data: volunteers = [] } = useVolunteers({ pastoralGroupId: schedule?.pastoralGroupId });
  const addAssignment = useAddAssignment();
  const removeAssignment = useRemoveAssignment();
  const deleteSchedule = useDeleteSchedule();

  const [volunteerId, setVolunteerId] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<ScheduleWarning[]>([]);

  if (isLoading) return <p className="py-6 text-sm text-gray-500">Carregando escala...</p>;
  if (error || !schedule) {
    return (
      <>
        <Header title="Escala" onBack={() => router.push('/escalas')} />
        <p className="py-6 text-sm text-red-600">{error?.message ?? 'Escala não encontrada.'}</p>
      </>
    );
  }

  const title = schedule.mass?.title ?? schedule.event?.name ?? 'Escala';
  const when = schedule.mass?.dateTime ?? schedule.event?.startDate;
  const cancelled = schedule.event?.status === 'CANCELLED';
  const pastoralVolunteers = volunteers.filter((v) => v.pastoralGroupId === schedule.pastoralGroupId);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setWarnings([]);
    if (!volunteerId || !role.trim()) return setMessage('Selecione o Voluntário e informe a função.');
    try {
      const res = await addAssignment.mutateAsync({ scheduleId: id, volunteerId: Number(volunteerId), role: role.trim() });
      setWarnings(res.warnings ?? []);
      setVolunteerId('');
      setRole('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao adicionar atribuição.');
    }
  }

  async function handleRemoveAssignment(assignmentId: number) {
    if (!window.confirm('Remover esta atribuição?')) return;
    setMessage(null);
    try {
      await removeAssignment.mutateAsync(assignmentId);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao remover atribuição.');
    }
  }

  async function handleDeleteSchedule() {
    if (!window.confirm(`Remover a escala de "${schedule!.pastoralGroup?.name}" para "${title}"? As ${schedule!.assignments.length} atribuição(ões) também serão apagadas.`)) return;
    try {
      await deleteSchedule.mutateAsync(id);
      router.push('/escalas');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao remover escala.');
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
            Evento cancelado: só é possível remover a escala.
          </p>
        )}
        {message && <p className="text-sm text-red-600">{message}</p>}
        {warnings.map((w) => (
          <p key={`${w.volunteerId}-${w.conflictsWith.scheduleId}`} className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            Atenção: {w.volunteerName} também está escalado em “{w.conflictsWith.title}” ({fmt(w.conflictsWith.date)}).
          </p>
        ))}

        <ul className="divide-y rounded-[16px] border border-[rgba(0,0,0,0.3)]">
          {schedule.assignments.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{a.volunteer.name} — <strong>{a.role}</strong></span>
              <button
                type="button"
                onClick={() => handleRemoveAssignment(a.id)}
                disabled={cancelled || removeAssignment.isPending}
                className="text-gray-400 hover:text-red-600 disabled:opacity-30"
                aria-label="Remover atribuição"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>

        {!cancelled && (
          <form onSubmit={handleAdd} className="flex items-end gap-2">
            <div className="flex-1">
              <SelectInput
                label="Voluntário"
                value={volunteerId}
                onChange={setVolunteerId}
                placeholder="Selecione o Voluntário"
                options={pastoralVolunteers.map((v) => ({ value: String(v.id), label: v.name }))}
              />
            </div>
            <div className="flex-1">
              <TextInput label="Função" value={role} onChange={setRole} placeholder="Função (ex: leitor)" />
            </div>
            <button
              type="submit"
              disabled={addAssignment.isPending}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {addAssignment.isPending ? 'Adicionando...' : 'Adicionar'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}