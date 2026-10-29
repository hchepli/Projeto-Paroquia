// src/hooks/albums/useAlbum.ts
import { useQuery } from '@tanstack/react-query';
import { Album } from '@/types/albums/album';
import { throwApiError } from '@/lib/errors';

async function fetchAlbum(id: number): Promise<Album> {
  const res = await fetch(`/api/albums/${id}`);
  if (!res.ok) await throwApiError(res, 'Erro ao buscar álbum.');
  return res.json();
}

export function useAlbum(id: number) {
  return useQuery({
    queryKey: ['albums', id],
    queryFn: () => fetchAlbum(id),
    enabled: Number.isInteger(id) && id > 0,
    retry: false, // 404 não deve ficar retentando
  });
}