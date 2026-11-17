// src/app/albuns/[id]/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import AlbumForm, { AlbumFormValues } from '@/components/ui/forms/AlbumForm';
import ImageInput from '@/components/ui/inputs/ImageInput';
import { useAlbum } from '@/hooks/albums/useAlbum';
import { useAlbums } from '@/hooks/albums/useAlbums';
import { useUpdateAlbum } from '@/hooks/albums/useUpdateAlbum';
import { usePhotos } from '@/hooks/photos/usePhotos';
import { useUploadPhoto } from '@/hooks/photos/useUploadPhoto';
import { useSetCoverPhoto } from '@/hooks/photos/useSetCoverPhoto';
import { useDeletePhoto } from '@/hooks/photos/useDeletePhoto';
import { usePermissions } from '@/hooks/auth/usePermissions';
import {
  getAlbumLoadError,
  getAlbumSaveError,
  getPhotoActionError,
  getPhotoUploadError,
} from '@/lib/albums/errors';
import {
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTO_SIZE,
  PHOTO_HELP_TEXT,
  canShowImage,
} from '@/lib/albums/upload';

const PHOTOS_PER_PAGE = 24;

interface UploadReport {
  sent: number;
  failed: { name: string; reason: string }[];
}

export default function AlbumDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canManageAlbums, isLoading: permsLoading } = usePermissions();

  const albumId = Number(params.id);
  const validId = Number.isInteger(albumId) && albumId > 0;

  const { data: album, isLoading: albumLoading, isError, error } = useAlbum(albumId);
  const {
    data: photos = [],
    isLoading: photosLoading,
    isError: photosError,
    error: photosErr,
    refetch: refetchPhotos,
  } = usePhotos(validId ? albumId : undefined);
  // A lista traz o nome do evento (GET /albums/:id não traz).
  const { data: albumsList, isLoading: listLoading } = useAlbums();

  const updateAlbum = useUpdateAlbum();
  const uploadPhoto = useUploadPhoto();
  const setCover = useSetCoverPhoto();
  const deletePhoto = useDeletePhoto();

  const wantsEdit = searchParams.get('edit') === '1';
  const [editOpen, setEditOpen] = useState(wantsEdit);
  const isEditing = editOpen && canManageAlbums;
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploadReport, setUploadReport] = useState<UploadReport | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PHOTOS_PER_PAGE);

  if (!validId || isError || (!albumLoading && !album)) {
    return (
      <>
        <Header title="Álbum" onBack={() => router.push('/albuns')} />
        <p role="alert" className="mt-6 text-sm text-red-700">
          {!validId
            ? 'Este endereço de álbum não é válido. Volte para a lista de álbuns.'
            : getAlbumLoadError(error)}
        </p>
      </>
    );
  }

  if (albumLoading || !album) {
    return (
      <>
        <Header title="Álbum" onBack={() => router.push('/albuns')} />
        <p className="mt-6 text-sm text-gray-500">Carregando álbum...</p>
      </>
    );
  }

  const eventName = albumsList?.find((a) => a.id === albumId)?.eventName ?? null;
  const eventLabelReady = !album.eventId || !listLoading;

  function closeEdit() {
    setFormError(null);
    setEditOpen(false);
    router.replace(`/albuns/${albumId}`); // tira ?edit=1 da barra
  }

  async function handleSaveEdit(values: AlbumFormValues) {
    setFormError(null);
    try {
      await updateAlbum.mutateAsync({
        id: albumId,
        title: values.title,
        description: values.description || null, // null limpa a descrição
        eventId: values.eventId ? Number(values.eventId) : null, // null desliga do evento
      });
      closeEdit();
    } catch (err) {
      setFormError(getAlbumSaveError(err));
    }
  }

  // UC028: uma foto recusada NÃO impede as outras.
  async function handleFiles(files: File[]) {
    if (files.length === 0 || isUploading) return;

    setUploadReport(null);
    setActionError(null);
    setIsUploading(true);
    const report: UploadReport = { sent: 0, failed: [] };

    for (const file of files) {
      if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
        report.failed.push({
          name: file.name,
          reason: 'Este arquivo não é uma foto JPG, PNG ou WEBP. Escolha outra foto.',
        });
        continue;
      }
      if (file.size > MAX_PHOTO_SIZE) {
        report.failed.push({
          name: file.name,
          reason: 'A foto é maior que 5 MB. Escolha uma foto menor.',
        });
        continue;
      }
      try {
        await uploadPhoto.mutateAsync({ albumId, file });
        report.sent += 1;
      } catch (err) {
        report.failed.push({ name: file.name, reason: getPhotoUploadError(err) });
      }
    }

    // Uma única atualização no fim do lote.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['photos'] }),
      queryClient.invalidateQueries({ queryKey: ['albums'] }),
    ]);
    setUploadReport(report);
    setIsUploading(false);
  }

  function handleSetCover(photoId: number) {
    setActionError(null);
    setCover.mutate(photoId, {
      onError: (err) => setActionError(getPhotoActionError(err, 'capa')),
    });
  }

  function handleRemovePhoto(photoId: number, isCover: boolean) {
    const extra =
      isCover && photos.length > 1 ? ' A foto mais antiga do álbum passará a ser a capa.' : '';
    if (!window.confirm(`Apagar esta foto? Isso não pode ser desfeito.${extra}`)) return;
    setActionError(null);
    deletePhoto.mutate(photoId, {
      onError: (err) => {
        setActionError(getPhotoActionError(err, 'apagar'));
        queryClient.invalidateQueries({ queryKey: ['photos'] });
      },
    });
  }

  const visiblePhotos = photos.slice(0, visibleCount);
  const pillBase =
    'rounded-full border px-3 py-1.5 text-sm font-medium disabled:opacity-50';

  return (
    <>
      <Header
        title={album.title}
        description={
          album.eventId
            ? eventName
              ? `Ligado ao evento: ${eventName}`
              : 'Ligado a um evento'
            : 'Sem evento'
        }
        actions={
          !permsLoading && canManageAlbums
            ? [
                {
                  label: isEditing ? 'Cancelar edição' : 'Editar álbum',
                  onClick: () => (isEditing ? closeEdit() : setEditOpen(true)),
                },
              ]
            : []
        }
        onBack={() => router.push('/albuns')}
      />

      {wantsEdit && !permsLoading && !canManageAlbums && (
        <p role="alert" className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Você só pode ver este álbum. Para mudar algo, fale com a secretaria.
        </p>
      )}

      {isEditing && (
        <div className="mt-6 rounded-lg border border-gray-200 p-4">
          {eventLabelReady ? (
            <AlbumForm
              initialValues={{
                title: album.title,
                description: album.description ?? '',
                eventId: album.eventId ? String(album.eventId) : '',
              }}
              eventLabel={album.eventId ? (eventName ?? 'Evento ligado') : ''}
              submitLabel="Salvar"
              submitting={updateAlbum.isPending}
              error={formError}
              onSubmit={handleSaveEdit}
              onCancel={closeEdit}
            />
          ) : (
            <p className="text-sm text-gray-500">Carregando...</p>
          )}
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-base font-semibold text-gray-700">
          Fotos {photosLoading || photosError ? '' : `(${photos.length})`}
        </h2>

        {actionError && (
          <div role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {uploadReport && (
          <div className="mb-4 space-y-2">
            {uploadReport.sent > 0 && (
              <div role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                {uploadReport.sent === 1
                  ? '1 foto foi enviada.'
                  : `${uploadReport.sent} fotos foram enviadas.`}
              </div>
            )}
            {uploadReport.failed.length > 0 && (
              <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                <p className="font-medium">
                  {uploadReport.failed.length === 1
                    ? '1 foto não foi enviada:'
                    : `${uploadReport.failed.length} fotos não foram enviadas:`}
                </p>
                <ul className="mt-1 list-disc pl-5">
                  {uploadReport.failed.map((f, i) => (
                    <li key={`${f.name}-${i}`}>
                      <span className="font-medium">{f.name}</span> — {f.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {photosError && (
          <div role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {getAlbumLoadError(photosErr)}{' '}
            <button type="button" onClick={() => refetchPhotos()} className="font-medium underline">
              Tentar de novo
            </button>
          </div>
        )}
        {photosLoading && <p className="text-sm text-gray-500">Carregando fotos...</p>}
        {!photosLoading && !photosError && photos.length === 0 && (
          <p className="mb-6 text-sm text-gray-500">
            {canManageAlbums
              ? 'Este álbum ainda não tem fotos. Use "Adicionar fotos" abaixo.'
              : 'Este álbum ainda não tem fotos.'}
          </p>
        )}

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visiblePhotos.map((photo, index) => (
            <li key={photo.id}>
              <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                {canShowImage(photo.url) ? (
                  <Image
                    src={photo.url}
                    alt={`Foto ${index + 1} do álbum ${album.title}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 px-2 text-center text-xs text-gray-500">
                    Foto indisponível
                  </div>
                )}
                {photo.isCover && (
                  <span className="absolute left-2 top-2 rounded bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-yellow-900">
                    Capa do álbum
                  </span>
                )}
              </div>

              {canManageAlbums && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {!photo.isCover && (
                    <button
                      type="button"
                      onClick={() => handleSetCover(photo.id)}
                      disabled={setCover.isPending}
                      aria-label={`Usar a foto ${index + 1} como capa do álbum`}
                      className={`${pillBase} border-[#701513] text-[#701513] hover:bg-[#701513]/5`}
                    >
                      Usar como capa
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id, photo.isCover)}
                    disabled={deletePhoto.isPending}
                    aria-label={`Apagar a foto ${index + 1} do álbum`}
                    className={`${pillBase} border-red-600 text-red-600 hover:bg-red-50`}
                  >
                    Apagar foto
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {photos.length > visibleCount && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PHOTOS_PER_PAGE)}
              className={`${pillBase} border-gray-400 text-gray-700 hover:bg-gray-50`}
            >
              Mostrar mais fotos ({photos.length - visibleCount} restantes)
            </button>
          </div>
        )}

        {canManageAlbums && !photosLoading && (
          <div className="mt-8">
            <ImageInput
              label="Adicionar fotos"
              multiple
              onFiles={handleFiles}
              accept={ALLOWED_PHOTO_TYPES.join(',')}
              helperText={PHOTO_HELP_TEXT}
              disabled={isUploading}
            />
            {isUploading && (
              <p role="status" className="mt-2 text-sm text-gray-600">
                Enviando fotos... Não feche esta página.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}