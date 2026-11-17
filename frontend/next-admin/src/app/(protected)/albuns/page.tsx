// src/app/albuns/page.tsx
'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { FolderOpen, Link2, Link2Off } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import GenericTable, { GenericTableColumn, GenericTableAction } from '@/components/ui/tables/GenericTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import { useAlbums } from '@/hooks/albums/useAlbums';
import { useDeleteAlbum } from '@/hooks/albums/useDeleteAlbum';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { useDebouncedValue } from '@/hooks/ui/useDebouncedValue';
import { getAlbumDeleteError, getAlbumLoadError } from '@/lib/albums/errors';
import { Album } from '@/types/albums/album';
import { canShowImage } from '@/lib/albums/upload';

const PAGE_SIZE = 10;
type Filter = 'all' | 'linked' | 'standalone';

export default function AlbunsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canManageAlbums, isLoading: permsLoading } = usePermissions();
  // O back devolve a lista inteira já com photoCount/coverUrl/eventName.
  const { data: albums = [], isLoading, isError, error, refetch } = useAlbums();
  const deleteAlbum = useDeleteAlbum();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  const linkedCount = albums.filter((a) => a.eventId !== null).length;
  const standaloneCount = albums.length - linkedCount;

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return albums.filter((a) => {
      const matchesFilter =
        filter === 'all' || (filter === 'linked' ? a.eventId !== null : a.eventId === null);
      return matchesFilter && (!term || a.title.toLowerCase().includes(term));
    });
  }, [albums, filter, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleFilter(next: Filter) {
    setFilter((prev) => (prev === next ? 'all' : next));
    setPage(1);
  }

  function handleRemove(album: Album) {
    const count = album.photoCount ?? 0;
    const confirmed = window.confirm(
      count > 0
        ? `Apagar o álbum "${album.title}"? As ${count} fotos dele também serão apagadas. Isso não pode ser desfeito.`
        : `Apagar o álbum "${album.title}"? Isso não pode ser desfeito.`,
    );
    if (!confirmed) return;
    setActionError(null);
    deleteAlbum.mutate(album.id, {
      onError: (err) => {
        setActionError(getAlbumDeleteError(err));
        // 404 = já foi removido por outra pessoa: atualiza a lista.
        queryClient.invalidateQueries({ queryKey: ['albums'] });
      },
    });
  }

  const columns: GenericTableColumn<Album>[] = [
    {
      key: 'cover',
      label: 'Capa',
      render: (a) =>
        canShowImage(a.coverUrl) ? (
          <Image
            src={a.coverUrl}
            alt={`Capa do álbum ${a.title}`}
            width={40}
            height={40}
            className="h-10 w-10 rounded object-cover"
          />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'title',
      label: 'Título',
      render: (a) => <span className="font-medium text-gray-800">{a.title}</span>,
    },
    {
      key: 'event',
      label: 'Evento',
      render: (a) => (a.eventId ? (a.eventName ?? 'Evento ligado') : 'Sem evento'),
    },
    {
      key: 'photos',
      label: 'Fotos',
      render: (a) =>
        (a.photoCount ?? 0) === 0 ? (
          <span className="text-amber-700">Sem fotos</span>
        ) : (
          a.photoCount
        ),
    },
  ];

  const actions: GenericTableAction<Album>[] = [
    {
      label: 'Ver fotos',
      onClick: (a) => router.push(`/albuns/${a.id}`),
      ariaLabel: (a) => `Ver fotos do álbum ${a.title}`,
    },
    ...(canManageAlbums
      ? [
          {
            label: 'Editar',
            onClick: (a: Album) => router.push(`/albuns/${a.id}?edit=1`),
            ariaLabel: (a: Album) => `Editar o álbum ${a.title}`,
          },
          {
            label: 'Remover',
            onClick: handleRemove,
            variant: 'danger' as const,
            disabled: () => deleteAlbum.isPending,
            ariaLabel: (a: Album) => `Remover o álbum ${a.title}`,
          },
        ]
      : []),
  ];

  const hasFilterOrSearch = filter !== 'all' || debouncedSearch.trim() !== '';
  const emptyMessage = hasFilterOrSearch
    ? 'Nenhum álbum encontrado. Tente outra palavra ou limpe o filtro.'
    : canManageAlbums
      ? 'Ainda não há álbuns. Clique em "Novo álbum" para criar o primeiro.'
      : 'Ainda não há álbuns.';

  return (
    <>
      <Header
        title="Álbuns de fotos"
        description="Veja e organize as fotos da paróquia."
        actions={
          !permsLoading && canManageAlbums
            ? [{ label: 'Novo álbum', onClick: () => router.push('/albuns/registrar') }]
            : []
        }
        onBack={() => router.back()}
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          icon={FolderOpen}
          title="Todos os álbuns"
          value={albums.length}
          onClick={() => {
            setFilter('all');
            setPage(1);
          }}
          active={filter === 'all'}
          actionLabel="Ver todos"
        />
        <Card
          icon={Link2}
          title="Ligados a um evento"
          value={linkedCount}
          onClick={() => toggleFilter('linked')}
          active={filter === 'linked'}
          actionLabel="Filtrar"
        />
        <Card
          icon={Link2Off}
          title="Sem evento"
          value={standaloneCount}
          onClick={() => toggleFilter('standalone')}
          active={filter === 'standalone'}
          actionLabel="Filtrar"
        />
      </div>

      {isError && (
        <div role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {getAlbumLoadError(error)}{' '}
          <button type="button" onClick={() => refetch()} className="font-medium underline">
            Tentar de novo
          </button>
        </div>
      )}
      {actionError && (
        <div role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={pageItems}
          rowKey={(a) => a.id}
          actions={actions}
          isLoading={isLoading || permsLoading}
          loadingMessage="Carregando álbuns..."
          emptyMessage={emptyMessage}
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Buscar pelo título..."
        />
        <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  );
}