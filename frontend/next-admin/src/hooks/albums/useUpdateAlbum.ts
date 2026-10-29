// src/hooks/albums/useUpdateAlbum.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Album } from '@/types/albums/album';
import { throwApiError } from '@/lib/errors';

// null = limpar o campo (description) / desvincular o evento (RN003).
// undefined some do JSON e NÃO altera nada.
interface UpdateAlbumInput {
  id: number;
  title?: string;
  description?: string | null;
  eventId?: number | null;
}

async function updateAlbum({ id, ...rest }: UpdateAlbumInput): Promise<Album> {
  const res = await fetch(`/api/albums/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rest),
  });
  if (!res.ok) await throwApiError(res, 'Erro ao atualizar álbum.');
  return res.json();
}

export function useUpdateAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAlbum,
    // O prefixo ['albums'] já cobre ['albums', id].
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['albums'] }),
  });
}