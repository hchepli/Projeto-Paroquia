import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MassTemplate } from '@/types/masses/mass-template';

interface UpdatePayload {
  id: number;
  data: Partial<Omit<MassTemplate, 'id'>>;
}

async function updateMassTemplate({ id, data }: UpdatePayload): Promise<MassTemplate> {
  const res = await fetch(`/api/mass-templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? 'Erro ao atualizar template.');
  }
  return res.json();
}

export function useUpdateMassTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMassTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-templates'] });
    },
  });
}