// src/hooks/photos/useSetCoverPhoto.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Photo } from '@/types/photos/photo';

async function setCover(id: number): Promise<Photo> {
  const res = await fetch(`/api/photos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isCover: true }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? 'Erro ao marcar capa.');
  return data;
}

export function useSetCoverPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setCover,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}