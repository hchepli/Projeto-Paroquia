// src/app/comunidade/eventos/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, CheckCircle2, XCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import GenericTable, { GenericTableColumn, GenericTableAction } from '@/components/ui/tables/GenericTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import { useEvents } from '@/hooks/events/useEvents';
import { useDeleteEvent } from '@/hooks/events/useDeleteEvent';
import { Event } from '@/types/events/events';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function EventosPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCancelled, setShowCancelled] = useState(false);

  const { data, isLoading } = useEvents({ page, limit: 10, search: search || undefined, includeAll: true });
  const deleteEvent = useDeleteEvent();

  const items = data?.data ?? [];

  const activeCount = useMemo(() => items.filter((e) => e.status === 'ACTIVE').length, [items]);
  const cancelledCount = useMemo(
    () => items.filter((e) => e.status === 'CANCELLED').length,
    [items],
  );

  const filteredItems = showCancelled ? items.filter((e) => e.status === 'CANCELLED') : items;

  function handleRemove(event: Event) {
    const confirmed = window.confirm(`Remover o evento "${event.name}"?`);
    if (!confirmed) return;
    deleteEvent.mutate(event.id);
  }

  const columns: GenericTableColumn<Event>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (event) => <span className="font-medium text-gray-800">{event.name}</span>,
    },
    {
      key: 'date',
      label: 'Data',
      render: (event) => formatDate(event.startDate),
    },
    {
      key: 'location',
      label: 'Local',
      render: (event) => event.location,
    },
    {
      key: 'status',
      label: 'Status',
      render: (event) => (
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            event.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {event.status === 'ACTIVE' ? 'Ativo' : 'Cancelado'}
        </span>
      ),
    },
  ];

  const actions: GenericTableAction<Event>[] = [
    {
      label: 'Editar',
      onClick: (event) => router.push(`/comunidade/eventos/${event.id}`),
    },
    {
      label: 'Confirmações',
      onClick: (event) => router.push(`/comunidade/eventos/${event.id}/confirmacoes`),
    },
    {
      label: 'Remover',
      onClick: handleRemove,
      variant: 'danger',
      disabled: () => deleteEvent.isPending,
    },
  ];

  return (
    <>
      <Header
        title="Eventos"
        description="Gerencie os eventos da paróquia."
        actions={[{ label: 'Novo Evento', onClick: () => router.push('/comunidade/eventos/registrar') }]}
        onBack={() => router.back()}
      />

      <div className="mt-8 grid grid-cols-3 gap-4">
        <Card icon={CalendarDays} title="Eventos (página atual)" value={items.length} />
        <Card icon={CheckCircle2} title="Ativos" value={activeCount} />
        <Card
          icon={XCircle}
          title="Cancelados"
          value={cancelledCount}
          onClick={() => setShowCancelled((prev) => !prev)}
          active={showCancelled}
        />
      </div>

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={filteredItems}
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
        />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          onPageChange={setPage}
        />
      </div>
    </>
  );
}
