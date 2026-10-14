// src/hooks/photos/usePhotos.ts
import { useQuery } from '@tanstack/react-query';
import { Photo } from '@/types/photos/photo';

async function fetchPhotos(albumId?: number): Promise<Photo[]> {
  const qs = albumId !== undefined ? `?albumId=${albumId}` : '';
  const res = await fetch(`/api/photos${qs}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? 'Erro ao buscar fotos.');
  return data;
}

// Sem argumento: todas as fotos (comportamento antigo).
// Com albumId: o filtro é feito no backend.
// A queryKey começa com 'photos', então invalidateQueries({ queryKey: ['photos'] })
// continua funcionando em todos os hooks de foto.
export function usePhotos(albumId?: number) {
  return useQuery({
    queryKey: ['photos', { albumId: albumId ?? null }],
    queryFn: () => fetchPhotos(albumId),
    enabled: albumId === undefined || Number.isFinite(albumId),
  });
}
