// src/hooks/events/useDeleteEvent.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

async function deleteEvent(id: number): Promise<void> {
  const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? 'Erro ao remover evento.');
  }
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}