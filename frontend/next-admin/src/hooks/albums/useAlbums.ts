import { useQuery } from '@tanstack/react-query';
import { Album } from '@/types/albums/album';
import { throwApiError } from '@/lib/errors';

async function fetchAlbums(): Promise<Album[]> {
  const res = await fetch('/api/albums');
  if (!res.ok) await throwApiError(res, 'Erro ao buscar álbuns.');
  return res.json();
}

export function useAlbums() {
  return useQuery({ queryKey: ['albums'], queryFn: fetchAlbums });
}