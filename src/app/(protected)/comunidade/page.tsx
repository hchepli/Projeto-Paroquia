'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ticket, Newspaper, Images, EyeOff } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import EventsPreviewCard from '@/components/ui/cards/EventsPreviewCard';
import AnnouncementsTable from '@/components/ui/tables/AnnouncementsTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import AnnouncementFormModal from '@/components/ui/forms/AnnouncementFormModal';
import AlbumFormModal from '@/components/ui/forms/AlbumFormModal';
import EventFormModal from '@/components/ui/forms/EventFormModal';
import { useAnnouncements } from '@/hooks/announcements/useAnnouncements';
import { useEvents } from '@/hooks/events/useEvents';
import { usePhotos } from '@/hooks/photos/usePhotos';
import { AnnouncementStatus } from '@/types/announcements/announcement';
import { Event } from '@/types/events/events';

type StatusFilter = 'ALL' | AnnouncementStatus;

interface Category {
  id: number;
  name: string;
  type: 'EVENT' | 'ANNOUNCEMENT';
}

async function fetchCategories(): Promise<Category[]> {
  const response = await fetch('/api/categories');
  if (!response.ok) throw new Error('Erro ao buscar categorias');
  return response.json();
}

function isWithinNextDays(dateStr: string, days: number): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const limit = new Date();
  limit.setDate(now.getDate() + days);
  return d >= now && d <= limit;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatTime(dateStr: string): string {
  return new Date(dateStr)
    .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    .replace(':', 'h');
}

function toEventPreviewItem(event: Event) {
  const date = new Date(event.startDate);
  const weekday = capitalize(
    date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
  );
  const month = capitalize(date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''));
  const timeRange = event.endDate
    ? `${formatTime(event.startDate)} - ${formatTime(event.endDate)}`
    : formatTime(event.startDate);

  return {
    id: event.id,
    day: String(date.getDate()),
    month,
    title: event.name,
    subtitle: `${weekday} ${timeRange}`,
  };
}

export default function ComunidadePage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [openAnnouncementModal, setOpenAnnouncementModal] = useState(false);
  const [openAlbumModal, setOpenAlbumModal] = useState(false);
  const [openEventModal, setOpenEventModal] = useState(false);

  const { data: tableData, isLoading: tableLoading } = useAnnouncements({
    search,
    page,
    limit: 10,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });
  const { data: publishedData } = useAnnouncements({ status: 'PUBLISHED', limit: 1 });
  const { data: draftData } = useAnnouncements({ status: 'DRAFT', limit: 1 });

  const { data: eventsResult, isLoading: eventsLoading } = useEvents();
  const { data: photos } = usePhotos();
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const categoryNameById = useMemo(() => {
    const map: Record<number, string> = {};
    (categories ?? []).forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const filteredItems = tableData?.data ?? [];

  const upcomingEvents = useMemo(
    () => (eventsResult?.data ?? []).filter((e) => isWithinNextDays(e.startDate, 30)),
    [eventsResult],
  );

  const publishedCount = publishedData?.total ?? 0;
  const draftCount = draftData?.total ?? 0;

  const eventsPreviewItems = useMemo(
    () =>
      (eventsResult?.data ?? [])
        .filter((e) => isWithinNextDays(e.startDate, 90))
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 4)
        .map(toEventPreviewItem),
    [eventsResult],
  );

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  return (
    <>
      <Header
        title="Comunidade"
        description="Gerencie o conteúdo do site da paróquia"
        actions={[
          { label: 'Novo Comunicado', onClick: () => setOpenAnnouncementModal(true) },
          { label: 'Novo Evento', onClick: () => setOpenEventModal(true) },
          { label: 'Novo Álbum', onClick: () => setOpenAlbumModal(true) },
        ]}
      />

      <div className="mt-8 grid grid-cols-5 gap-4">
        <div className="col-span-3 grid grid-cols-2 gap-4">
          <Card
            icon={Ticket}
            title="Próximos Eventos"
            value={upcomingEvents.length}
            description="Nos próximos 30 dias"
          />
          <Card icon={Newspaper} title="Comunicados Publicados" value={publishedCount} />
          <Card icon={Images} title="Fotos na galeria" value={photos?.length ?? '—'} />
          <Card
            icon={EyeOff}
            title="Itens ocultos"
            value={draftCount}
            badge="Aguardando revisão"
            badgeColor="yellow"
          />
        </div>

        <div className="col-span-2">
          <EventsPreviewCard
            title="Próximos Eventos"
            items={eventsPreviewItems}
            isLoading={eventsLoading}
          />
        </div>
      </div>

      <div className="my-6">
        <AnnouncementsTable
          items={filteredItems}
          isLoading={tableLoading}
          categoryNameById={categoryNameById}
          search={search}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          onViewAll={() => {
            setSearch('');
            setStatusFilter('ALL');
            setPage(1);
          }}
        />
        <PaginationControls
          page={tableData?.page ?? 1}
          totalPages={tableData?.totalPages ?? 1}
          onPageChange={setPage}
        />
      </div>

      <AnnouncementFormModal
        open={openAnnouncementModal}
        onClose={() => setOpenAnnouncementModal(false)}
      />
      <AlbumFormModal open={openAlbumModal} onClose={() => setOpenAlbumModal(false)} />
      <EventFormModal open={openEventModal} onClose={() => setOpenEventModal(false)} />
    </>
  );
}
