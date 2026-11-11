// src/app/comunidade/albuns/[id]/page.tsx
'use client';

import { useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Star, Trash2, Upload } from 'lucide-react';
import Header from '@/components/layout/Header';
import AlbumForm, { AlbumFormValues } from '@/components/ui/forms/AlbumForm';
import { useAlbum } from '@/hooks/albums/useAlbum';
import { useUpdateAlbum } from '@/hooks/albums/useUpdateAlbum';
import { usePhotos } from '@/hooks/photos/usePhotos';
import { useUploadPhoto } from '@/hooks/photos/useUploadPhoto';
import { useSetCoverPhoto } from '@/hooks/photos/useSetCoverPhoto';
import { useDeletePhoto } from '@/hooks/photos/useDeletePhoto';
import { useEvents } from '@/hooks/events/useEvents';
import { usePermissions } from '@/hooks/auth/usePermissions';

// Espelham os limites do back (RNF008). O back continua sendo a barreira real.
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface UploadReport {
  sent: number;
  failed: { name: string; reason: string }[];
}

export default function AlbumDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canManageAlbums } = usePermissions();

  const albumId = Number(params.id);
  const validId = Number.isInteger(albumId) && albumId > 0;

  const { data: album, isLoading: albumLoading, isError, error } = useAlbum(albumId);
  const { data: photos = [], isLoading: photosLoading } = usePhotos(validId ? albumId : undefined);
  const { data: eventsResult } = useEvents({ limit: 100, sortBy: 'startDate', order: 'desc' });

  const updateAlbum = useUpdateAlbum();
  const uploadPhoto = useUploadPhoto();
  const setCover = useSetCoverPhoto();
  const deletePhoto = useDeletePhoto();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === '1');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploadReport, setUploadReport] = useState<UploadReport | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!validId || isError || (!albumLoading && !album)) {
    return (
      <>
        <Header title="Álbum" onBack={() => router.push('/comunidade/albuns')} />
        <p className="mt-6 text-sm text-red-600">
          {!validId
            ? 'Álbum inválido.'
            : error instanceof Error
              ? error.message
              : 'Álbum não encontrado.'}
        </p>
      </>
    );
  }

  if (albumLoading || !album) {
    return (
      <>
        <Header title="Álbum" onBack={() => router.back()} />
        <p className="mt-6 text-sm text-gray-400">Carregando álbum...</p>
      </>
    );
  }

  // Garante que o evento já vinculado aparece no select mesmo fora das 100 opções.
  const eventOptions = (eventsResult?.data ?? []).map((e) => ({
    value: String(e.id),
    label: e.name,
  }));
  if (album.eventId && !eventOptions.some((o) => o.value === String(album.eventId))) {
    eventOptions.unshift({ value: String(album.eventId), label: `Evento #${album.eventId}` });
  }

  async function handleSaveEdit(values: AlbumFormValues) {
    setFormError(null);
    try {
      await updateAlbum.mutateAsync({
        id: albumId,
        title: values.title,
        description: values.description || null, // null limpa a descrição
        eventId: values.eventId ? Number(values.eventId) : null, // null desvincula (RN003)
      });
      setIsEditing(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar álbum.');
    }
  }

  // UC028 — rejeição parcial: um arquivo inválido NÃO interrompe os demais.
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setUploadReport(null);
    setIsUploading(true);
    const report: UploadReport = { sent: 0, failed: [] };

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        report.failed.push({ name: file.name, reason: 'Tipo não permitido (use JPEG, PNG ou WEBP).' });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        report.failed.push({ name: file.name, reason: 'Arquivo maior que 5MB.' });
        continue;
      }
      try {
        await uploadPhoto.mutateAsync({ albumId, file });
        report.sent += 1;
      } catch (err) {
        report.failed.push({
          name: file.name,
          reason: err instanceof Error ? err.message : 'Erro ao enviar.',
        });
      }
    }

    // Uma única invalidação no fim do lote.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['photos'] }),
      queryClient.invalidateQueries({ queryKey: ['albums'] }),
    ]);
    setUploadReport(report);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSetCover(photoId: number) {
    setActionError(null);
    setCover.mutate(photoId, {
      onError: (err) => setActionError(err instanceof Error ? err.message : 'Erro ao marcar capa.'),
    });
  }

  function handleRemovePhoto(photoId: number) {
    if (!window.confirm('Remover esta foto?')) return;
    setActionError(null);
    deletePhoto.mutate(photoId, {
      onError: (err) => setActionError(err instanceof Error ? err.message : 'Erro ao remover foto.'),
    });
  }

  return (
    <>
      <Header
        title={album.title}
        description={album.eventId ? `Vinculado ao Evento #${album.eventId}` : 'Álbum avulso'}
        actions={
          canManageAlbums
            ? [
                {
                  label: isEditing ? 'Cancelar edição' : 'Editar',
                  onClick: () => {
                    setFormError(null);
                    setIsEditing((prev) => !prev);
                  },
                },
              ]
            : []
        }
        onBack={() => router.push('/comunidade/albuns')}
      />

      {isEditing && canManageAlbums && (
        <div className="mt-6 max-w-lg rounded-lg border border-gray-200 p-4">
          <AlbumForm
            initialValues={{
              title: album.title,
              description: album.description ?? '',
              eventId: album.eventId ? String(album.eventId) : '',
            }}
            eventOptions={eventOptions}
            submitLabel="Salvar alterações"
            submitting={updateAlbum.isPending}
            error={formError}
            onSubmit={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      )}

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Fotos {photosLoading ? '' : `(${photos.length})`}
          </h2>
          {canManageAlbums && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                <Upload size={14} />
                {isUploading ? 'Enviando...' : 'Adicionar fotos'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={handleFileChange}
              />
            </>
          )}
        </div>

        {actionError && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</div>
        )}

        {uploadReport && (
          <div className="mb-4 space-y-2">
            {uploadReport.sent > 0 && (
              <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                {uploadReport.sent} foto(s) enviada(s) com sucesso.
              </div>
            )}
            {uploadReport.failed.length > 0 && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                <p className="font-medium">{uploadReport.failed.length} foto(s) recusada(s):</p>
                <ul className="mt-1 list-disc pl-5">
                  {uploadReport.failed.map((f, i) => (
                    <li key={`${f.name}-${i}`}>
                      {f.name}: {f.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
              <img src={photo.url} alt="" loading="lazy" className="aspect-square w-full object-cover" />

              {photo.isCover && (
                <span className="absolute left-2 top-2 rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-900">
                  Capa
                </span>
              )}

              {canManageAlbums && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-black/50 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {!photo.isCover && (
                    <button
                      onClick={() => handleSetCover(photo.id)}
                      disabled={setCover.isPending}
                      title="Marcar como capa"
                      className="text-white hover:text-yellow-300 disabled:opacity-50"
                    >
                      <Star size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemovePhoto(photo.id)}
                    disabled={deletePhoto.isPending}
                    title="Remover foto"
                    className="text-white hover:text-red-400 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}