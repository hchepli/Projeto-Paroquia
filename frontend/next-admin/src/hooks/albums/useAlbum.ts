// src/hooks/albums/useAlbum.ts
import { useQuery } from '@tanstack/react-query';
import { Album } from '@/types/albums/album';

async function fetchAlbum(id: number): Promise<Album> {
  const res = await fetch(`/api/albums/${id}`);
  if (!res.ok) throw new Error('Erro ao buscar álbum.');
  return res.json();
}

export function useAlbum(id: number) {
  return useQuery({
    queryKey: ['albums', id],
    queryFn: () => fetchAlbum(id),
    enabled: !!id,
  });
}