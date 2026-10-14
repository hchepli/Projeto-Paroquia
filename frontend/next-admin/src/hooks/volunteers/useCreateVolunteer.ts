// src/hooks/volunteers/useCreateVolunteer.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateVolunteerInput } from '@/types/volunteers/create-volunteer';
import { Volunteer } from '@/types/volunteers/volunteer';
import { parseApiError } from '@/lib/api-error';

async function createVolunteer(input: CreateVolunteerInput): Promise<Volunteer> {
  const res = await fetch('/api/volunteers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseApiError(res, 'Erro ao cadastrar voluntário.');
  return res.json();
}

export function useCreateVolunteer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVolunteer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['volunteers'] }),
  });
}