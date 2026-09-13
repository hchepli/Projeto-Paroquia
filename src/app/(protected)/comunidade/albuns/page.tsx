// src/app/comunidade/albuns/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, FolderOpen, Images, Link2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import AlbumsTable from '@/components/ui/tables/AlbumsTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import { useAlbums } from '@/hooks/albums/useAlbums';
import { usePhotos } from '@/hooks/photos/usePhotos';
import { useDeleteAlbum } from '@/hooks/albums/useDeleteAlbum';
import { Album } from '@/types/albums/album';

const PAGE_SIZE = 10;

export default function AlbunsPage() {
  const router = useRouter();
  const { data: albums = [], isLoading: albumsLoading } = useAlbums();
  const { data: photos = [], isLoading: photosLoading } = usePhotos();
  const deleteAlbum = useDeleteAlbum();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showNoCover, setShowNoCover] = useState(false);

  const photosByAlbum = useMemo(() => {
    const map = new Map<number, typeof photos>();
    for (const photo of photos) {
      const list = map.get(photo.albumId) ?? [];
      list.push(photo);
      map.set(photo.albumId, list);
    }
    return map;
  }, [photos]);

  const albumsWithoutCover = useMemo(
    () => albums.filter((album) => !(photosByAlbum.get(album.id) ?? []).some((p) => p.isCover)),
    [albums, photosByAlbum],
  );

  const linkedToEventCount = albums.filter((a) => a.eventId !== null).length;

  const filteredAlbums = useMemo(() => {
    const base = showNoCover ? albumsWithoutCover : albums;
    if (!search) return base;
    return base.filter((album) => album.title.toLowerCase().includes(search.toLowerCase()));
  }, [albums, albumsWithoutCover, showNoCover, search]);

  const totalPages = Math.max(1, Math.ceil(filteredAlbums.length / PAGE_SIZE));
  const paginatedAlbums = filteredAlbums.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleRemove(album: Album) {
    const photoCount = (photosByAlbum.get(album.id) ?? []).length;
    const confirmed = window.confirm(
      photoCount > 0
        ? `Remover o álbum "${album.title}" também removerá ${photoCount} foto(s) vinculada(s). Confirmar?`
        : `Remover o álbum "${album.title}"?`,
    );
    if (!confirmed) return;
    deleteAlbum.mutate(album.id);
  }

  return (
    <>
      <Header
        title="Galeria — Álbuns"
        description="Gerencie os álbuns de fotos da paróquia."
        actions={[{ label: 'Novo Álbum', onClick: () => router.push('/comunidade/albuns/registrar') }]}
      />

      <div className="mt-8 grid grid-cols-4 gap-4">
        <Card icon={FolderOpen} title="Álbuns" value={albums.length} />
        <Card icon={Images} title="Fotos" value={photos.length} />
        <Card icon={Link2} title="Vinculados a Evento" value={linkedToEventCount} />
        <Card
          icon={AlertCircle}
          title="Sem capa definida"
          value={albumsWithoutCover.length}
          onClick={() => {
            setShowNoCover((prev) => !prev);
            setPage(1);
          }}
          active={showNoCover}
        />
      </div>

      <div className="my-6">
        <AlbumsTable
          items={paginatedAlbums}
          photosByAlbum={photosByAlbum}
          isLoading={albumsLoading || photosLoading}
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onRemove={handleRemove}
          isRemoving={deleteAlbum.isPending}
        />
        <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  );
}