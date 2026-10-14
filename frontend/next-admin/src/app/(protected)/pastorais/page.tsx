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
import { errorMessage } from '@/lib/api-error';

const columns: GenericTableColumn<PastoralGroup>[] = [
  { key: 'name', label: 'Nome', render: (p) => p.name },
  { key: 'contact', label: 'Contato', render: (p) => p.contact ?? '—' },
  { key: 'defaultRole', label: 'Função padrão', render: (p) => p.defaultRole ?? '—' },
];

export default function PastoraisPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: pastoralGroups = [], isLoading, error: loadError } = usePastoralGroups({ enabled: !!currentUser });
  const { mutateAsync: removePastoral } = useDeletePastoralGroup();
  const [actionError, setActionError] = useState<string | null>(null);

  const isAdmin = currentUser?.role.name === ROLE_NAMES.ADMIN;
  const isCoordenador = currentUser?.role.name === ROLE_NAMES.COORDENADOR;

  // Coordenador só enxerga a própria pastoral (RN006)
  const items = isCoordenador
    ? pastoralGroups.filter((p) => p.id === currentUser?.pastoralGroup?.id)
    : pastoralGroups;

  async function handleDelete(pastoral: PastoralGroup) {
    if (!window.confirm(`Remover a pastoral ${pastoral.name}?`)) return;
    setActionError(null);
    try {
      await removePastoral(pastoral.id);
    } catch (err) {
      // 409 já traz as contagens ("possui 1 usuário(s), 3 voluntário(s)...")
      setActionError(errorMessage(err, 'Erro ao remover pastoral.'));
    }
  }

  const actions: GenericTableAction<PastoralGroup>[] = [
    { label: 'Editar', onClick: (p) => router.push(`/pastorais/${p.id}/editar`) },
    ...(isAdmin ? [{ label: 'Remover', variant: 'danger' as const, onClick: handleDelete }] : []),
  ];

  return (
    <>
      <Header
        title="Pastorais"
        description="Grupos de atuação da paróquia."
        actions={isAdmin ? [{ label: 'Nova Pastoral', onClick: () => router.push('/pastorais/registrar') }] : []}
      />

      {(loadError || actionError) && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {actionError ?? errorMessage(loadError, 'Erro ao buscar pastorais.')}
        </p>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={items}
          rowKey={(p) => p.id}
          actions={actions}
          isLoading={isLoading || userLoading}
          emptyMessage="Nenhuma pastoral cadastrada."
        />
      </div>
    </>
  );
}