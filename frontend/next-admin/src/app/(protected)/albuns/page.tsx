// src/app/comunidade/albuns/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, FolderOpen, Images, Link2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import GenericTable, { GenericTableColumn, GenericTableAction } from '@/components/ui/tables/GenericTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import { useAlbums } from '@/hooks/albums/useAlbums';
import { useDeleteAlbum } from '@/hooks/albums/useDeleteAlbum';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { Album } from '@/types/albums/album';

const PAGE_SIZE = 10;

export default function AlbunsPage() {
  const router = useRouter();
  const { canManageAlbums } = usePermissions();
  // A lista já vem com photoCount/coverUrl/eventName (1 query no back).
  const { data: albums = [], isLoading, isError, error } = useAlbums();
  const deleteAlbum = useDeleteAlbum();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showEmpty, setShowEmpty] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const emptyAlbums = useMemo(() => albums.filter((a) => (a.photoCount ?? 0) === 0), [albums]);
  const totalPhotos = albums.reduce((sum, a) => sum + (a.photoCount ?? 0), 0);
  const linkedToEventCount = albums.filter((a) => a.eventId !== null).length;

  const filteredAlbums = useMemo(() => {
    const base = showEmpty ? emptyAlbums : albums;
    if (!search) return base;
    return base.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()));
  }, [albums, emptyAlbums, showEmpty, search]);

  const totalPages = Math.max(1, Math.ceil(filteredAlbums.length / PAGE_SIZE));
  const paginatedAlbums = filteredAlbums.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleRemove(album: Album) {
    const count = album.photoCount ?? 0;
    const confirmed = window.confirm(
      count > 0
        ? `Remover o álbum "${album.title}" também removerá ${count} foto(s) vinculada(s). Confirmar?`
        : `Remover o álbum "${album.title}"?`,
    );
    if (!confirmed) return;
    setActionError(null);
    deleteAlbum.mutate(album.id, {
      onError: (err) => setActionError(err instanceof Error ? err.message : 'Erro ao remover álbum.'),
    });
  }

  const columns: GenericTableColumn<Album>[] = [
    {
      key: 'title',
      label: 'Título',
      render: (a) => <span className="font-medium text-gray-800">{a.title}</span>,
    },
    {
      key: 'event',
      label: 'Evento vinculado',
      render: (a) => (a.eventId ? (a.eventName ?? `Evento #${a.eventId}`) : 'Avulso'),
    },
    { key: 'photos', label: 'Fotos', render: (a) => a.photoCount ?? 0 },
    {
      key: 'cover',
      label: 'Capa',
      render: (a) =>
        a.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.coverUrl}
            alt={`Capa do álbum ${a.title}`}
            loading="lazy"
            className="h-8 w-8 rounded object-cover"
          />
        ) : (
          <span className="text-xs text-amber-600">Sem fotos</span>
        ),
    },
  ];

  const actions: GenericTableAction<Album>[] = [
    { label: 'Ver fotos', onClick: (a) => router.push(`/comunidade/albuns/${a.id}`) },
    ...(canManageAlbums
      ? [
          { label: 'Editar', onClick: (a: Album) => router.push(`/comunidade/albuns/${a.id}?edit=1`) },
          {
            label: 'Remover',
            onClick: handleRemove,
            variant: 'danger' as const,
            disabled: () => deleteAlbum.isPending,
          },
        ]
      : []),
  ];

  return (
    <>
      <Header
        title="Galeria — Álbuns"
        description="Gerencie os álbuns de fotos da paróquia."
        actions={
          canManageAlbums
            ? [{ label: 'Novo Álbum', onClick: () => router.push('/comunidade/albuns/registrar') }]
            : []
        }
        onBack={() => router.back()}
      />

      <div className="mt-8 grid grid-cols-4 gap-4">
        <Card icon={FolderOpen} title="Álbuns" value={albums.length} />
        <Card icon={Images} title="Fotos" value={totalPhotos} />
        <Card icon={Link2} title="Vinculados a Evento" value={linkedToEventCount} />
        <Card
          icon={AlertCircle}
          title="Sem fotos"
          value={emptyAlbums.length}
          onClick={() => {
            setShowEmpty((prev) => !prev);
            setPage(1);
          }}
          active={showEmpty}
        />
      </div>

      {(isError || actionError) && (
        <p className="mt-4 text-sm text-red-600">
          {actionError ?? (error instanceof Error ? error.message : 'Erro ao carregar álbuns.')}
        </p>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={paginatedAlbums}
          rowKey={(a) => a.id}
          actions={actions}
          isLoading={isLoading}
          loadingMessage="Carregando álbuns..."
          emptyMessage="Nenhum álbum encontrado."
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Buscar por título..."
        />
        <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  );
}