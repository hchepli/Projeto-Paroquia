// src/hooks/masses/useCreateMass.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Mass } from '@/types/masses/masses';

export interface CreateMassInput {
  title: string;
  dateTime: string;
  type: string;
  location: string;
  notes?: string;
}

async function createMass(input: CreateMassInput): Promise<Mass> {
  const res = await fetch('/api/masses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? 'Erro ao criar missa.');
  }

  return res.json();
}

export function useCreateMass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['masses'] });
    },
  });
}