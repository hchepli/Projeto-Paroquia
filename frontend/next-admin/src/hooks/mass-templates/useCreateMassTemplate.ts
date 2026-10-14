// src/hooks/mass-templates/useCreateMassTemplate.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MassTemplate } from '@/types/masses/mass-template';

export interface CreateMassTemplateInput {
  dayOfWeek: number;
  time: string;
  title: string;
  location: string;
  type: string;
  notes?: string;
}

async function createMassTemplate(input: CreateMassTemplateInput): Promise<MassTemplate> {
  const res = await fetch('/api/mass-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? 'Erro ao criar missa recorrente.');
  }

  return res.json();
}

export function useCreateMassTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMassTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['mass-templates'] });
    },
  });
}