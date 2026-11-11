// src/app/comunidade/eventos/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, CheckCircle2, XCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import GenericTable, {
  GenericTableColumn,
  GenericTableAction,
} from '@/components/ui/tables/GenericTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import EventStatusBadge from '@/components/ui/badges/EventStatusBadge';
import EventDeleteDialog from '@/components/ui/forms/EventDeleteConfirm';
import { useEvents } from '@/hooks/events/useEvents';
import { useUpdateEvent } from '@/hooks/events/useUpdateEvent';
import { useDebouncedValue } from '@/hooks/ui/useDebouncedValue';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { AdminEvent, EventStatus } from '@/types/events/events';

type StatusFilter = 'ALL' | EventStatus;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventosPage() {
  const router = useRouter();
  const { canManageEvents } = usePermissions();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [deleting, setDeleting] = useState<AdminEvent | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const status = statusFilter === 'ALL' ? undefined : statusFilter;

  const { data, isLoading, isError, error, refetch } = useEvents({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    status,
    sortBy: 'startDate',
    order: 'desc',
  });

  // Contagens reais (total do servidor), não só da página atual.
  const { data: allData } = useEvents({ limit: 1 });
  const { data: activeData } = useEvents({ limit: 1, status: 'ACTIVE' });
  const { data: cancelledData } = useEvents({ limit: 1, status: 'CANCELLED' });

  const updateEvent = useUpdateEvent();
  const items = data?.data ?? [];

  async function handleToggleStatus(event: AdminEvent) {
    const cancelling = event.status === 'ACTIVE';
    const ok = window.confirm(
      cancelling
        ? `Cancelar o evento "${event.name}"? Ele sai do calendário e do site, mas pode ser reativado.`
        : `Reativar o evento "${event.name}"?`,
    );
    if (!ok) return;

    setActionError(null);
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        status: cancelling ? 'CANCELLED' : 'ACTIVE',
      });
    } catch (err) {
      setActionError(getFriendlyErrorMessage(err, 'Erro ao alterar o status do evento.'));
    }
  }

  function changeStatusFilter(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  const columns: GenericTableColumn<AdminEvent>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (event) => <span className="font-medium text-gray-800">{event.name}</span>,
    },
    { key: 'date', label: 'Início', render: (event) => formatDateTime(event.startDate) },
    { key: 'location', label: 'Local', render: (event) => event.location },
    {
      key: 'status',
      label: 'Status',
      render: (event) => <EventStatusBadge status={event.status} />,
    },
    ...(canManageEvents
      ? [
          {
            key: 'confirmations',
            label: 'Confirmações',
            render: (event: AdminEvent) => event._count?.attendanceConfirmations ?? '—',
          },
        ]
      : []),
  ];

  const actions: GenericTableAction<AdminEvent>[] = [
    {
      label: canManageEvents ? 'Editar' : 'Ver',
      onClick: (event) => router.push(`/comunidade/eventos/${event.id}`),
    },
    ...(canManageEvents
      ? ([
          {
            label: 'Confirmações',
            onClick: (event) => router.push(`/comunidade/eventos/${event.id}/confirmacoes`),
          },
          {
            label: (event) => (event.status === 'ACTIVE' ? 'Cancelar evento' : 'Reativar'),
            onClick: handleToggleStatus,
            disabled: () => updateEvent.isPending,
          },
          {
            label: 'Remover',
            onClick: (event) => {
              setActionError(null);
              setDeleting(event);
            },
            variant: 'danger',
          },
        ] satisfies GenericTableAction<AdminEvent>[])
      : []),
  ];

  return (
    <>
      <Header
        title="Eventos"
        description="Gerencie os eventos da paróquia."
        actions={
          canManageEvents
            ? [{ label: 'Novo Evento', onClick: () => router.push('/comunidade/eventos/registrar') }]
            : []
        }
        onBack={() => router.back()}
      />

      <div className="mt-8 grid grid-cols-3 gap-4">
        <Card
          icon={CalendarDays}
          title="Todos"
          value={allData?.total ?? '—'}
          onClick={() => changeStatusFilter('ALL')}
          active={statusFilter === 'ALL'}
        />
        <Card
          icon={CheckCircle2}
          title="Ativos"
          value={activeData?.total ?? '—'}
          onClick={() => changeStatusFilter('ACTIVE')}
          active={statusFilter === 'ACTIVE'}
        />
        <Card
          icon={XCircle}
          title="Cancelados"
          value={cancelledData?.total ?? '—'}
          onClick={() => changeStatusFilter('CANCELLED')}
          active={statusFilter === 'CANCELLED'}
        />
      </div>

      {(isError || actionError) && (
        <p className="mt-4 text-sm text-red-600">
          {actionError ?? getFriendlyErrorMessage(error, 'Erro ao carregar eventos.')}{' '}
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
          rowKey={(event) => event.id}
          actions={actions}
          isLoading={isLoading}
          loadingMessage="Carregando eventos..."
          emptyMessage="Nenhum evento encontrado."
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Buscar por nome..."
          filters={[
            {
              key: 'status',
              placeholder: 'Status',
              value: statusFilter,
              onChange: (v) => changeStatusFilter(v as StatusFilter),
              options: [
                { value: 'ALL', label: 'Todos os status' },
                { value: 'ACTIVE', label: 'Ativos' },
                { value: 'CANCELLED', label: 'Cancelados' },
              ],
            },
          ]}
        />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          onPageChange={setPage}
        />
      </div>

      {deleting && <EventDeleteDialog event={deleting} onClose={() => setDeleting(null)} />}
    </>
  );
}