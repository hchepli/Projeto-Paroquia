// src/app/comunidade/eventos/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, CheckCircle2, XCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import TableEvents from '@/components/ui/tables/TableEvents';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import { useEvents } from '@/hooks/events/useEvents';
import { useDeleteEvent } from '@/hooks/events/useDeleteEvent';
import { Event } from '@/types/events/events';

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

  return (
    <>
      <Header
        title="Eventos"
        description="Gerencie os eventos da paróquia."
        actions={[{ label: 'Novo Evento', onClick: () => router.push('/comunidade/eventos/registrar') }]}
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
        <TableEvents
          items={filteredItems}
          isLoading={isLoading}
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onRemove={handleRemove}
          isRemoving={deleteEvent.isPending}
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