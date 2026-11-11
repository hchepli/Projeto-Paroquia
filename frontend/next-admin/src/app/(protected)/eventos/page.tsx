// src/app/(protected)/eventos/page.tsx
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

const LIST_PATH = '/eventos';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('pt-BR');
  const time = d
    .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    .replace(':', 'h');
  return `${date} às ${time}`;
}

export default function EventosPage() {
  const router = useRouter();
  const { canManageEvents, isLoading: permLoading } = usePermissions();
  // Só mostra botões de gestão depois que as permissões carregaram.
  const canManage = !permLoading && canManageEvents;

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
        ? `Cancelar o evento "${event.name}"?\n\nEle deixa de aparecer no calendário e no site. Nada é apagado: você pode reativar quando quiser.`
        : `Reativar o evento "${event.name}"?\n\nEle volta a aparecer no calendário e no site.`,
    );
    if (!ok) return;

    setActionError(null);
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        status: cancelling ? 'CANCELLED' : 'ACTIVE',
      });
    } catch (err) {
      setActionError(
        getFriendlyErrorMessage(
          err,
          'Não foi possível mudar a situação do evento. Tente de novo em instantes.',
        ),
      );
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
    { key: 'date', label: 'Quando', render: (event) => formatDateTime(event.startDate) },
    { key: 'location', label: 'Local', render: (event) => event.location },
    {
      key: 'status',
      label: 'Situação',
      render: (event) => <EventStatusBadge status={event.status} />,
    },
  ];

  if (canManage) {
    columns.push({
      key: 'confirmations',
      label: 'Quem vai',
      render: (event) => {
        const n = event._count?.attendanceConfirmations;
        return n === undefined ? '—' : `${n} ${n === 1 ? 'pessoa' : 'pessoas'}`;
      },
    });
  }

  const actions: GenericTableAction<AdminEvent>[] = [
    {
      label: canManage ? 'Editar' : 'Ver',
      onClick: (event) => router.push(`/eventos/${event.id}`),
    },
  ];

  if (canManage) {
    actions.push(
      {
        label: 'Ver quem vai',
        onClick: (event) => router.push(`/eventos/${event.id}/confirmacoes`),
      },
      {
        label: (event) => (event.status === 'ACTIVE' ? 'Cancelar evento' : 'Reativar evento'),
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
    );
  }

  const hasFilter = Boolean(debouncedSearch) || statusFilter !== 'ALL';
  const emptyMessage = hasFilter
    ? 'Nenhum evento encontrado com essa busca. Tente outro nome ou clique em “Todos os eventos”.'
    : canManage
      ? 'Ainda não há eventos. Clique em “Novo evento” para cadastrar o primeiro.'
      : 'Ainda não há eventos cadastrados.';

  return (
    <>
      <Header
        title="Eventos"
        description="Veja e organize os eventos da paróquia."
        actions={
          canManage
            ? [
                {
                  label: 'Novo evento',
                  onClick: () =>
                    router.push(`/eventos/registrar?voltar=${encodeURIComponent(LIST_PATH)}`),
                },
              ]
            : []
        }
        onBack={() => router.back()}
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          icon={CalendarDays}
          title="Todos os eventos"
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
        <div role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-base text-red-700">
          {actionError ??
            getFriendlyErrorMessage(
              error,
              'Não foi possível carregar os eventos. Verifique a internet e tente de novo.',
            )}{' '}
          {isError && !actionError && (
            <button type="button" onClick={() => refetch()} className="font-medium underline">
              Tentar novamente
            </button>
          )}
        </div>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={items}
          rowKey={(event) => event.id}
          actions={actions}
          isLoading={isLoading || permLoading}
          loadingMessage="Carregando os eventos... um instante."
          emptyMessage={emptyMessage}
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Buscar pelo nome do evento..."
          filters={[
            {
              key: 'status',
              placeholder: 'Situação',
              value: statusFilter,
              onChange: (v) => changeStatusFilter(v as StatusFilter),
              options: [
                { value: 'ALL', label: 'Todos os eventos' },
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
