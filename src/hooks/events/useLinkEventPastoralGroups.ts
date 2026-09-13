// src/hooks/events/useLinkEventPastoralGroups.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface LinkInput {
  eventId: number;
  pastoralGroupIds: number[];
}

async function linkPastoralGroups({ eventId, pastoralGroupIds }: LinkInput) {
  const res = await fetch(`/api/events/${eventId}/pastoral-groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pastoralGroupIds }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? 'Erro ao vincular pastorais.');
  return data;
}

export function useLinkEventPastoralGroups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: linkPastoralGroups,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events', variables.eventId] });
    },
  });
}