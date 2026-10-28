// src/app/(protected)/sacramentos/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import GenericTable, {
  GenericTableColumn,
  GenericTableAction,
} from '@/components/ui/tables/GenericTable';
import SacramentDeleteDialog from '@/components/ui/forms/SacramentDeleteDialog';
import { useSacraments } from '@/hooks/sacraments/useSacraments';
import { useReorderSacraments } from '@/hooks/sacraments/useReorderSacraments';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { Sacrament } from '@/types/sacraments/sacraments';

export default function SacramentosPage() {
  const router = useRouter();
  // RF018/RN005: só Admin Geral e Secretaria gerenciam (precisa existir no usePermissions).
  const { canManageSacraments } = usePermissions();

  const { data, isLoading, isError, error, refetch } = useSacraments();
  const reorder = useReorderSacraments();

  const [deleting, setDeleting] = useState<Sacrament | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // O back já ordena; reordenamos aqui só por segurança (ex.: cache antigo).
  const items = useMemo(
    () => [...(data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id),
    [data],
  );

  async function move(sacrament: Sacrament, direction: -1 | 1) {
    const from = items.findIndex((s) => s.id === sacrament.id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= items.length) return;

    const ids = items.map((s) => s.id);
    [ids[from], ids[to]] = [ids[to], ids[from]];

    setActionError(null);
    try {
      await reorder.mutateAsync(ids);
    } catch (err) {
      setActionError(getFriendlyErrorMessage(err, 'Erro ao reordenar sacramentos.'));
    }
  }

  const columns: GenericTableColumn<Sacrament>[] = [
    {
      key: 'order',
      label: '#',
      render: (s) => items.findIndex((i) => i.id === s.id) + 1,
    },
    {
      key: 'name',
      label: 'Nome',
      render: (s) => <span className="font-medium text-gray-800">{s.name}</span>,
    },
    { key: 'slug', label: 'Slug', render: (s) => s.slug },
    { key: 'faq', label: 'Perguntas', render: (s) => s.faq?.length ?? 0 },
  ];

  const actions: GenericTableAction<Sacrament>[] = [
    {
      label: canManageSacraments ? 'Editar' : 'Ver',
      onClick: (s) => router.push(`/sacramentos/${s.id}`),
    },
    ...(canManageSacraments
      ? ([
          {
            label: 'Subir',
            onClick: (s) => move(s, -1),
            disabled: (s) => reorder.isPending || items[0]?.id === s.id,
          },
          {
            label: 'Descer',
            onClick: (s) => move(s, 1),
            disabled: (s) => reorder.isPending || items[items.length - 1]?.id === s.id,
          },
          {
            label: 'Remover',
            onClick: (s) => {
              setActionError(null);
              setDeleting(s);
            },
            variant: 'danger',
          },
        ] satisfies GenericTableAction<Sacrament>[])
      : []),
  ];

  return (
    <>
      <Header
        title="Sacramentos"
        description="Gerencie os sacramentos exibidos no site, na ordem em que aparecem."
        actions={
          canManageSacraments
            ? [{ label: 'Novo Sacramento', onClick: () => router.push('/sacramentos/registrar') }]
            : []
        }
        onBack={() => router.back()}
      />

      {(isError || actionError) && (
        <p className="mt-4 text-sm text-red-600">
          {actionError ?? getFriendlyErrorMessage(error, 'Erro ao carregar sacramentos.')}{' '}
          {isError && (
            <button onClick={() => refetch()} className="underline">
              Tentar novamente
            </button>
          )}
        </p>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={items}
          rowKey={(s) => s.id}
          actions={actions}
          isLoading={isLoading}
          loadingMessage="Carregando sacramentos..."
          emptyMessage="Nenhum sacramento cadastrado."
        />
      </div>

      {deleting && <SacramentDeleteDialog sacrament={deleting} onClose={() => setDeleting(null)} />}
    </>
  );
}
