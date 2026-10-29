// src/hooks/albums/useCreateAlbum.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Album } from '@/types/albums/album';
import { throwApiError } from '@/lib/errors';

interface CreateAlbumInput {
  title: string;
  slug?: string;
  description?: string;
  eventId?: number;
}

async function createAlbum(input: CreateAlbumInput): Promise<Album> {
  const res = await fetch('/api/albums', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) await throwApiError(res, 'Erro ao criar álbum.');
  return res.json();
}

export function useCreateAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAlbum,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['albums'] }),
  });
}