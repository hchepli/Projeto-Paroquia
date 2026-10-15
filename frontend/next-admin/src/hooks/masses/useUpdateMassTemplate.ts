// src/hooks/masses/useUpdateMassTemplate.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MassTemplateUpdateResult,
  UpdateMassTemplatePayload,
} from '@/types/masses/mass-template';
import { throwApiError } from '@/lib/errors';

interface UpdatePayload {
  id: number;
  data: UpdateMassTemplatePayload;
  /** Só vale junto de data.active === false: apaga ocorrências futuras sem escala. */
  removeFuture?: boolean;
}

async function updateMassTemplate({
  id,
  data,
  removeFuture,
}: UpdatePayload): Promise<MassTemplateUpdateResult> {
  const qs = removeFuture ? '?removeFuture=true' : '';
  const res = await fetch(`/api/mass-templates/${id}${qs}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) await throwApiError(res, 'Erro ao atualizar template.');
  return res.json();
}

export function useUpdateMassTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMassTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-templates'] });
      // desativar com removeFuture apaga Missas; reativar gera novas no próximo /calendar
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['masses'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}
