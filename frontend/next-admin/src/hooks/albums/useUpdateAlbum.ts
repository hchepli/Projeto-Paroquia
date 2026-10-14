// src/hooks/albums/useUpdateAlbum.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Album } from '@/types/albums/album';

interface UpdateAlbumInput {
  id: number;
  title?: string;
  description?: string;
  eventId?: number | null;
}

async function updateAlbum({ id, ...rest }: UpdateAlbumInput): Promise<Album> {
  const res = await fetch(`/api/albums/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rest),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? 'Erro ao atualizar álbum.');
  return data;
}

export function useUpdateAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAlbum,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['albums', variables.id] });
    },
  });
}