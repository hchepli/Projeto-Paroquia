// src/hooks/attendance-confirmations/useDeleteAttendanceConfirmation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { throwApiError } from '@/lib/errors';

async function deleteConfirmation(id: string): Promise<{ id: string }> {
  const res = await fetch(`/api/attendance-confirmations/${id}`, { method: 'DELETE' });
  if (!res.ok) await throwApiError(res, 'Erro ao excluir confirmação.');
  return res.json();
}

export function useDeleteAttendanceConfirmation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteConfirmation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-confirmations'] });
      queryClient.invalidateQueries({ queryKey: ['events'] }); // _count da lista
    },
  });
}