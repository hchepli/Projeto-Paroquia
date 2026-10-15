// src/hooks/mass-templates/useCreateMassTemplate.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateMassTemplatePayload, MassTemplate } from '@/types/masses/mass-template';
import { throwApiError } from '@/lib/errors';

async function createMassTemplate(input: CreateMassTemplatePayload): Promise<MassTemplate> {
  const res = await fetch('/api/mass-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) await throwApiError(res, 'Erro ao criar missa recorrente.');
  return res.json();
}

export function useCreateMassTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMassTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['masses'] });
      queryClient.invalidateQueries({ queryKey: ['mass-templates'] });
    },
  });
}
