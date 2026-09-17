// src/app/comunidade/albuns/[id]/page.tsx
'use client';

import { useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Star, Trash2, Upload } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useAlbum } from '@/hooks/albums/useAlbum';
import { useUpdateAlbum } from '@/hooks/albums/useUpdateAlbum';
import { usePhotos } from '@/hooks/photos/usePhotos';
import { useUploadPhoto } from '@/hooks/photos/useUploadPhoto';
import { useSetCoverPhoto } from '@/hooks/photos/useSetCoverPhoto';
import { useDeletePhoto } from '@/hooks/photos/useDeletePhoto';
import { useEvents } from '@/hooks/events/useEvents';

export default function AlbumDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const albumId = Number(params.id);

  const { data: album, isLoading: albumLoading } = useAlbum(albumId);
  const { data: allPhotos = [], isLoading: photosLoading } = usePhotos();
  const { data: eventsResult } = useEvents({ limit: 100 });
  const events = eventsResult?.data ?? [];

  const updateAlbum = useUpdateAlbum();
  const uploadPhoto = useUploadPhoto();
  const setCover = useSetCoverPhoto();
  const deletePhoto = useDeletePhoto();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === '1');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventId, setEventId] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const photos = useMemo(
    () => allPhotos.filter((p) => p.albumId === albumId),
    [allPhotos, albumId],
  );

  // Preenche o formulário de edição só na primeira vez que o álbum chega
  // (evita sobrescrever o que o usuário está digitando a cada refetch).
  const [formInitialized, setFormInitialized] = useState(false);
  if (album && !formInitialized) {
    setTitle(album.title);
    setDescription(album.description ?? '');
    setEventId(album.eventId ? String(album.eventId) : '');
    setFormInitialized(true);
  }

  async function handleSaveEdit() {
    if (!title.trim()) return;
    await updateAlbum.mutateAsync({
      id: albumId,
      title: title.trim(),
      description: description.trim() || undefined,
      eventId: eventId ? Number(eventId) : null,
    });
    setIsEditing(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);

    const hasNoCover = photos.length === 0;

    try {
      for (let i = 0; i < files.length; i++) {
        await uploadPhoto.mutateAsync({
          albumId,
          file: files[i],
          isCover: hasNoCover && i === 0,
        });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro ao enviar foto(s).');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleRemovePhoto(photoId: number) {
    if (!window.confirm('Remover esta foto?')) return;
    deletePhoto.mutate(photoId);
  }

  if (albumLoading || !album) {
    return null;
  }

  return (
    <>
      <Header
        title={album.title}
        description={album.eventId ? `Vinculado ao Evento #${album.eventId}` : 'Álbum avulso'}
        actions={[
          {
            label: isEditing ? 'Cancelar edição' : 'Editar',
            onClick: () => setIsEditing((prev) => !prev),
          },
          { label: 'Voltar para Álbuns', onClick: () => router.push('/comunidade/albuns') },
        ]}
        onBack={() => router.back()}
      />

      {isEditing && (
        <div className="mt-6 max-w-lg space-y-4 rounded-lg border border-gray-200 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Evento vinculado</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400"
            >
              <option value="">Nenhum (álbum avulso)</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSaveEdit}
            disabled={updateAlbum.isPending}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {updateAlbum.isPending ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      )}

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Fotos {photosLoading ? '' : `(${photos.length})`}
          </h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadPhoto.isPending}
            className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            <Upload size={14} />
            {uploadPhoto.isPending ? 'Enviando...' : 'Adicionar fotos'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={handleFileChange}
          />
        </div>

        {uploadError && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {uploadError}
          </div>
        )}

        {photosLoading && <p className="text-sm text-gray-400">Carregando fotos...</p>}

        {!photosLoading && photos.length === 0 && (
          <p className="text-sm text-gray-400">Nenhuma foto neste álbum ainda.</p>
        )}

        <div className="grid grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-lg border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="aspect-square w-full object-cover" />

              {photo.isCover && (
                <span className="absolute left-2 top-2 rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-900">
                  Capa
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-black/50 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!photo.isCover && (
                  <button
                    onClick={() => setCover.mutate(photo.id)}
                    title="Marcar como capa"
                    className="text-white hover:text-yellow-300"
                  >
                    <Star size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleRemovePhoto(photo.id)}
                  title="Remover foto"
                  className="text-white hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}