// src/components/pessoas/VolunteersSection.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import GenericTable, { GenericTableColumn } from '@/components/ui/tables/GenericTable';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';
import { useVolunteers } from '@/hooks/volunteers/useVolunteers';
import { useDeleteVolunteer } from '@/hooks/volunteers/useVolunteerMutations';
import { Volunteer } from '@/types/volunteers/volunteer';
import { ApiError, errorMessage } from '@/lib/api-error';
import { VolunteerAssignment, describeAssignments } from '@/lib/volunteer-assignments';

const columns: GenericTableColumn<Volunteer>[] = [
  { key: 'name', label: 'Nome', render: (v) => v.name },
  { key: 'phone', label: 'Telefone', render: (v) => v.phone },
  { key: 'email', label: 'E-mail', render: (v) => v.email ?? '—' },
  { key: 'pastoral', label: 'Pastoral', render: (v) => v.pastoralGroup?.name ?? '—' },
];

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

interface Props {
  isCoordenador: boolean;
  hasPastoral: boolean;
  userLoading: boolean;
}

export default function VolunteersSection({ isCoordenador, hasPastoral, userLoading }: Props) {
  const router = useRouter();
  const coordenadorSemPastoral = isCoordenador && !hasPastoral;

  const { data: volunteers = [], isLoading, error: loadError } = useVolunteers();
  const { data: pastoralGroups = [] } = usePastoralGroups({ enabled: !userLoading && !isCoordenador });
  const { mutateAsync: removeVolunteer } = useDeleteVolunteer();

  const [search, setSearch] = useState('');
  const [pastoralFilter, setPastoralFilter] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const items = useMemo(() => {
    const term = search.trim().toLowerCase();
    return volunteers.filter((v) => {
      if (pastoralFilter && String(v.pastoralGroupId) !== pastoralFilter) return false;
      if (!term) return true;
      return [v.name, v.phone, v.email ?? ''].some((f) => f.toLowerCase().includes(term));
    });
  }, [volunteers, search, pastoralFilter]);

  async function handleDelete(volunteer: Volunteer) {
    if (!window.confirm(`Remover o voluntário ${volunteer.name}?`)) return;
    setActionError(null);

    try {
      await removeVolunteer({ id: volunteer.id });
    } catch (err) {
      // UC009: 409 com as escalas e pedido de confirmação extra
      if (err instanceof ApiError && err.status === 409 && err.body?.requiresConfirmation) {
        const all = (err.body.assignments ?? []) as VolunteerAssignment[];
        const future = all.filter((a) => a.isFuture);
        const pastCount = all.length - future.length;

        const parts: string[] = [];
        if (future.length > 0) {
          parts.push(
            `${volunteer.name} está em ${future.length} ${plural(
              future.length,
              'escala que ainda vai acontecer',
              'escalas que ainda vão acontecer',
            )}:\n\n${describeAssignments(future)}`,
          );
        }
        if (pastCount > 0) {
          parts.push(`Também aparece em ${pastCount} ${plural(pastCount, 'escala antiga', 'escalas antigas')}.`);
        }
        parts.push(`Se você remover, ${volunteer.name} sai dessas escalas.\n\nRemover mesmo assim?`);

        if (window.confirm(parts.join('\n\n'))) {
          try {
            await removeVolunteer({ id: volunteer.id, confirm: true });
          } catch (err2) {
            setActionError(errorMessage(err2, 'Não foi possível remover. Tente de novo.'));
          }
        }
        return;
      }
      setActionError(errorMessage(err, 'Não foi possível remover. Tente de novo.'));
    }
  }

  const hasFilter = search.trim() !== '' || pastoralFilter !== '';
  const emptyMessage = coordenadorSemPastoral
    ? 'Seu acesso ainda não está ligado a uma pastoral. Peça ao administrador para ligar.'
    : hasFilter
      ? 'Nenhum voluntário encontrado. Tente buscar com outras palavras.'
      : 'Ainda não há voluntários cadastrados. Use o botão "Cadastrar voluntário".';

  return (
    <>
      {(loadError || actionError) && (
        <p role="alert" className="mt-4 whitespace-pre-line text-base text-red-600">
          {actionError ?? errorMessage(loadError, 'Não foi possível carregar os voluntários. Tente de novo em instantes.')}
        </p>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={items}
          rowKey={(v) => v.id}
          isLoading={isLoading || userLoading}
          emptyMessage={emptyMessage}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por nome, telefone ou e-mail..."
          filters={
            isCoordenador
              ? undefined
              : [
                  {
                    key: 'pastoral',
                    placeholder: 'Todas as pastorais',
                    value: pastoralFilter,
                    onChange: setPastoralFilter,
                    options: [
                      { value: '', label: 'Todas as pastorais' },
                      ...pastoralGroups.map((pg) => ({ value: String(pg.id), label: pg.name })),
                    ],
                  },
                ]
          }
          actions={[
            { label: 'Editar', onClick: (v) => router.push(`/voluntario/${v.id}/editar`) },
            { label: 'Remover', variant: 'danger', onClick: handleDelete },
          ]}
        />
      </div>
    </>
  );
}