'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, Newspaper, Images, EyeOff } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import EventsPreviewCard from '@/components/ui/cards/EventsPreviewCard';
import CommunityContentTable, {
  CommunityContentItem,
  CommunityContentType,
} from '@/components/ui/tables/CommunityContentTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import { useAnnouncements } from '@/hooks/announcements/useAnnouncements';
import { useEvents } from '@/hooks/events/useEvents';
import { useAlbums } from '@/hooks/albums/useAlbums';
import { usePhotos } from '@/hooks/photos/usePhotos';
import { Event } from '@/types/events/events';
import { usePermissions } from '@/hooks/auth/usePermissions';

type TypeFilter = 'ALL' | CommunityContentType;

const PAGE_SIZE = 10;

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
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [page, setPage] = useState(1);

  // Contagens dos cards do topo — consultas dedicadas (status específico),
  // independentes da lista "todos" usada na tabela genérica abaixo.
  const { data: publishedData } = useAnnouncements({ status: 'PUBLISHED', limit: 1 });
  const { data: draftData } = useAnnouncements({ status: 'DRAFT', limit: 1 });

  // Lista "todos" usada pra montar a tabela genérica (sem filtro de status).
  const { data: announcementsResult, isLoading: announcementsLoading } = useAnnouncements({
    limit: 100,
  });
  const { canManageEvents } = usePermissions();

  // Tabela de conteúdo: todos os status, mais recentes primeiro.
  const { data: eventsResult, isLoading: eventsLoading } = useEvents({
    limit: 100,
    sortBy: 'startDate',
    order: 'desc',
  });
  // Cards e preview: só próximos e ativos, ordenados pelo servidor.
  const { data: upcomingResult, isLoading: upcomingLoading } = useEvents({
    period: 'upcoming',
    status: 'ACTIVE',
    limit: 50,
  });
  const { data: albums = [], isLoading: albumsLoading } = useAlbums();
  const { data: photos } = usePhotos();

  const upcomingEvents = useMemo(
    () => (upcomingResult?.data ?? []).filter((e) => isWithinNextDays(e.startDate, 30)),
    [upcomingResult],
  );

  const publishedCount = publishedData?.total ?? 0;
  const draftCount = draftData?.total ?? 0;

  const eventsPreviewItems = useMemo(
    () =>
      (upcomingResult?.data ?? [])
        .filter((e) => isWithinNextDays(e.startDate, 90))
        .slice(0, 4)
        .map(toEventPreviewItem),
    [upcomingResult],
  );

  // Merge das 3 entidades numa única lista, ordenada por data desc.
  const allItems: CommunityContentItem[] = useMemo(() => {
    const albumItems: CommunityContentItem[] = albums.map((a) => ({
      id: `album-${a.id}`,
      type: 'ALBUM',
      title: a.title,
      date: a.createdAt,
      statusLabel: a.eventId ? 'Vinculado a evento' : 'Avulso',
      href: '/comunidade/albuns',
    }));

    const announcementItems: CommunityContentItem[] = (announcementsResult?.data ?? []).map(
      (c) => ({
        id: `announcement-${c.id}`,
        type: 'ANNOUNCEMENT',
        title: c.title,
        date: c.createdAt,
        statusLabel: c.status === 'PUBLISHED' ? 'Publicado' : 'Oculto',
        href: '/comunidade/comunicados',
      }),
    );

    const eventItems: CommunityContentItem[] = (eventsResult?.data ?? []).map((e) => ({
      id: `event-${e.id}`,
      type: 'EVENT',
      title: e.name,
      date: e.startDate,
      statusLabel: e.status === 'ACTIVE' ? 'Ativo' : 'Cancelado',
      href: '/comunidade/eventos',
    }));

    return [...albumItems, ...announcementItems, ...eventItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [albums, announcementsResult, eventsResult]);

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (typeFilter !== 'ALL') {
      items = items.filter((i) => i.type === typeFilter);
    }
    if (search) {
      items = items.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()));
    }
    return items;
  }, [allItems, typeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleTypeFilterChange(value: TypeFilter) {
    setTypeFilter(value);
    setPage(1);
  }

  const contentLoading = albumsLoading || eventsLoading || announcementsLoading;

  return (
    <>
      <Header
        title="Comunidade"
        description="Gerencie o conteúdo do site da paróquia"
        actions={[
          { label: 'Novo Comunicado', onClick: () => router.push('/comunidade/comunicados/registrar') },
          ...(canManageEvents ? [{ label: 'Novo Evento', onClick: () => router.push('/comunidade/eventos/registrar') }] : []),
          { label: 'Novo Álbum', onClick: () => router.push('/comunidade/albuns/registrar') },
        ]}
      />

      <div className="mt-8 grid grid-cols-5 gap-4">
        <div className="col-span-3 grid grid-cols-2 gap-4">
          <Card
            icon={Ticket}
            title="Próximos Eventos"
            value={upcomingEvents.length}
            description="Nos próximos 30 dias"
            onClick={() => router.push('/comunidade/eventos')}
          />
          <Card
            icon={Newspaper}
            title="Comunicados Publicados"
            value={publishedCount}
            onClick={() => router.push('/comunidade/comunicados')}
          />
          <Card
            icon={Images}
            title="Fotos na galeria"
            value={photos?.length ?? '—'}
            onClick={() => router.push('/comunidade/albuns')}
          />
          <Card
            icon={EyeOff}
            title="Itens ocultos"
            value={draftCount}
            badge="Aguardando revisão"
            badgeColor="yellow"
            onClick={() => router.push('/comunidade/comunicados')}
          />
        </div>

        <div className="col-span-2">
          <EventsPreviewCard
            title="Próximos Eventos"
            items={eventsPreviewItems}
            isLoading={upcomingLoading}
          />
        </div>
      </div>

      <div className="my-6">
        <CommunityContentTable
          items={paginatedItems}
          isLoading={contentLoading}
          search={search}
          onSearchChange={handleSearchChange}
          typeFilter={typeFilter}
          onTypeFilterChange={handleTypeFilterChange}
        />
        <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  );
}