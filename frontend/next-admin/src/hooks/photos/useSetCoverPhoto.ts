// src/hooks/photos/useSetCoverPhoto.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Photo } from '@/types/photos/photo';
import { throwApiError } from '@/lib/errors';

async function setCover(id: number): Promise<Photo> {
  const res = await fetch(`/api/photos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isCover: true }),
  });
  if (!res.ok) await throwApiError(res, 'Erro ao marcar capa.');
  return res.json();
}

export function useSetCoverPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setCover,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}