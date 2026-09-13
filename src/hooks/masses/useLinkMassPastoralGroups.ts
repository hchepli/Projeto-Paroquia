// src/hooks/masses/useLinkMassPastoralGroups.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface LinkMassPastoralGroupsInput {
  massId: number;
  pastoralGroupIds: number[];
}

async function linkMassPastoralGroups({ massId, pastoralGroupIds }: LinkMassPastoralGroupsInput) {
  const res = await fetch(`/api/masses/${massId}/pastoral-groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pastoralGroupIds }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? 'Missa criada, mas houve erro ao vincular as Pastorais.');
  }

  return res.json().catch(() => null);
}

export function useLinkMassPastoralGroups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: linkMassPastoralGroups,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['masses'] });
    },
  });
}