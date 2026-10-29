// src/hooks/albums/useDeleteAlbum.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { throwApiError } from '@/lib/errors';

async function deleteAlbum(id: number): Promise<void> {
  const res = await fetch(`/api/albums/${id}`, { method: 'DELETE' });
  if (!res.ok) await throwApiError(res, 'Erro ao remover álbum.');
}

export function useDeleteAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAlbum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}