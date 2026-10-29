// src/hooks/photos/usePhotos.ts
import { useQuery } from '@tanstack/react-query';
import { Photo } from '@/types/photos/photo';
import { throwApiError } from '@/lib/errors';

async function fetchPhotos(albumId?: number): Promise<Photo[]> {
  const qs = albumId !== undefined ? `?albumId=${albumId}` : '';
  const res = await fetch(`/api/photos${qs}`);
  if (!res.ok) await throwApiError(res, 'Erro ao buscar fotos.');
  return res.json();
}

// Passe sempre o albumId. Sem argumento carrega TODAS as fotos (evitar em telas de lista).
export function usePhotos(albumId?: number) {
  return useQuery({
    queryKey: ['photos', { albumId: albumId ?? null }],
    queryFn: () => fetchPhotos(albumId),
    enabled: albumId === undefined || (Number.isInteger(albumId) && albumId > 0),
  });
}