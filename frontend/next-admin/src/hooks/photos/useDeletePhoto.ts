// src/hooks/photos/useDeletePhoto.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { throwApiError } from '@/lib/errors';

async function deletePhoto(id: number): Promise<void> {
  const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' });
  if (!res.ok) await throwApiError(res, 'Erro ao remover foto.');
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}