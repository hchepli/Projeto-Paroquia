// src/app/(admin)/voluntario/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import GenericTable, { GenericTableColumn } from '@/components/ui/tables/GenericTable';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';
import { useVolunteers } from '@/hooks/volunteers/useVolunteers';
import { useDeleteVolunteer } from '@/hooks/volunteers/useVolunteerMutations';
import { Volunteer } from '@/types/volunteers/volunteer';
import { ROLE_NAMES } from '@/lib/constants/role-names';
import { ApiError, errorMessage } from '@/lib/api-error';

const columns: GenericTableColumn<Volunteer>[] = [
  { key: 'name', label: 'Nome', render: (v) => v.name },
  { key: 'phone', label: 'Telefone', render: (v) => v.phone },
  { key: 'email', label: 'E-mail', render: (v) => v.email ?? '—' },
  { key: 'pastoral', label: 'Pastoral', render: (v) => v.pastoralGroup?.name ?? '—' },
];

interface AffectedAssignment {
  title: string;
  role: string;
  date: string | null;
}

export default function VoluntariosPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const isCoordenador = currentUser?.role.name === ROLE_NAMES.COORDENADOR;

  const { data: volunteers = [], isLoading, error: loadError } = useVolunteers();
  const { data: pastoralGroups = [] } = usePastoralGroups({ enabled: !!currentUser && !isCoordenador });
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
      // UC009: 409 com a lista de escalas afetadas, pede confirmação extra
      if (err instanceof ApiError && err.status === 409 && err.body?.requiresConfirmation) {
        const lines = (err.body.assignments as AffectedAssignment[])
          .slice(0, 10)
          .map((a) => `• ${a.title}${a.date ? ` — ${new Date(a.date).toLocaleDateString('pt-BR')}` : ''} (${a.role})`)
          .join('\n');

        if (window.confirm(`${err.message}\n\n${lines}\n\nRemover mesmo assim?`)) {
          try {
            await removeVolunteer({ id: volunteer.id, confirm: true });
          } catch (err2) {
            setActionError(errorMessage(err2, 'Erro ao remover voluntário.'));
          }
        }
        return;
      }
      setActionError(errorMessage(err, 'Erro ao remover voluntário.'));
    }
  }

  return (
    <>
      <Header
        title={isCoordenador ? `Voluntários de ${currentUser?.pastoralGroup?.name ?? '—'}` : 'Voluntários'}
        description="Pessoas que podem ser escaladas em Missas e Eventos."
        actions={[{ label: 'Registrar Voluntário', onClick: () => router.push('/voluntario/registrar') }]}
      />

      {(loadError || actionError) && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {actionError ?? errorMessage(loadError, 'Erro ao buscar voluntários.')}
        </p>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={items}
          rowKey={(v) => v.id}
          isLoading={isLoading || userLoading}
          emptyMessage="Nenhum voluntário encontrado."
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