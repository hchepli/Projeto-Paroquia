// src/app/(admin)/pastorais/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import GenericTable, { GenericTableAction, GenericTableColumn } from '@/components/ui/tables/GenericTable';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';
import { useDeletePastoralGroup } from '@/hooks/pastoral-groups/usePastoralGroupMutations';
import { PastoralGroup } from '@/types/pastoral-groups/pastoral-group';
import { ROLE_NAMES } from '@/lib/constants/role-names';
import { ApiError, errorMessage } from '@/lib/api-error';

const columns: GenericTableColumn<PastoralGroup>[] = [
  { key: 'name', label: 'Nome', render: (p) => p.name },
  { key: 'contact', label: 'Contato', render: (p) => p.contact ?? '—' },
  { key: 'defaultRole', label: 'Função padrão', render: (p) => p.defaultRole ?? '—' },
];

interface Blockers {
  users?: number;
  volunteers?: number;
  schedules?: number;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function PastoraisPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: pastoralGroups = [], isLoading, error: loadError } = usePastoralGroups({ enabled: !!currentUser });
  const { mutateAsync: removePastoral } = useDeletePastoralGroup();
  const [actionError, setActionError] = useState<string | null>(null);

  const isAdmin = currentUser?.role?.name === ROLE_NAMES.ADMIN;
  const isCoordenador = currentUser?.role?.name === ROLE_NAMES.COORDENADOR;

  // Coordenador só enxerga a própria pastoral (RN006)
  const items = isCoordenador
    ? pastoralGroups.filter((p) => p.id === currentUser?.pastoralGroup?.id)
    : pastoralGroups;

  async function handleDelete(pastoral: PastoralGroup) {
    if (
      !window.confirm(
        `Remover a pastoral ${pastoral.name}?\n\nEla também deixará de aparecer ligada a missas e eventos.`,
      )
    ) {
      return;
    }
    setActionError(null);

    try {
      await removePastoral(pastoral.id);
    } catch (err) {
      // O back BLOQUEIA (409 com blockers) enquanto houver coordenadores, voluntários ou escalas
      if (err instanceof ApiError && err.status === 409 && err.body?.blockers) {
        const b = err.body.blockers as Blockers;
        const parts: string[] = [];
        if (b.users) parts.push(plural(b.users, 'coordenador', 'coordenadores'));
        if (b.volunteers) parts.push(plural(b.volunteers, 'voluntário', 'voluntários'));
        if (b.schedules) parts.push(plural(b.schedules, 'escala', 'escalas'));
        setActionError(
          `Não dá para remover a pastoral ${pastoral.name} porque ela ainda tem: ${parts.join(', ')}. Mude ou remova essas pessoas e escalas primeiro.`,
        );
        return;
      }
      setActionError(errorMessage(err, 'Não foi possível remover a pastoral. Tente de novo.'));
    }
  }

  // Secretaria só consulta (RN005): sem Editar nem Remover
  const actions: GenericTableAction<PastoralGroup>[] = [
    ...(isAdmin || isCoordenador
      ? [{ label: 'Editar', onClick: (p: PastoralGroup) => router.push(`/pastorais/${p.id}/editar`) }]
      : []),
    ...(isAdmin ? [{ label: 'Remover', variant: 'danger' as const, onClick: handleDelete }] : []),
  ];

  const emptyMessage =
    isCoordenador && !currentUser?.pastoralGroup
      ? 'Seu acesso ainda não está ligado a uma pastoral. Peça ao administrador para ligar.'
      : 'Ainda não há pastorais cadastradas.';

  return (
    <>
      <Header
        title="Pastorais"
        description="Grupos de atuação da paróquia."
        actions={isAdmin ? [{ label: 'Nova pastoral', onClick: () => router.push('/pastorais/registrar') }] : []}
      />

      {(loadError || actionError) && (
        <p role="alert" className="mt-4 whitespace-pre-line text-base text-red-600">
          {actionError ?? errorMessage(loadError, 'Não foi possível carregar as pastorais. Tente de novo em instantes.')}
        </p>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={items}
          rowKey={(p) => p.id}
          actions={actions}
          isLoading={isLoading || userLoading}
          emptyMessage={emptyMessage}
        />
      </div>
    </>
  );
}