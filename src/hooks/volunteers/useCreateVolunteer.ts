// src/hooks/volunteers/useCreateVolunteer.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateVolunteerInput } from '@/types/volunteers/create-volunteer';
import { Volunteer } from '@/types/volunteers/volunteer';

async function createVolunteer(input: CreateVolunteerInput): Promise<Volunteer> {
  const res = await fetch('/api/volunteers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? 'Erro ao cadastrar voluntário.');
  }

  return res.json();
}

export function useCreateVolunteer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVolunteer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
    },
  });
}
