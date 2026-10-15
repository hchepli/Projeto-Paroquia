// src/hooks/masses/useDeleteMass.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MassDeleteResult, MassScheduleConflict } from '@/types/masses/masses';
import { throwApiError } from '@/lib/errors';

/** Lançado quando o back responde 409 MASS_HAS_SCHEDULES (RN016). */
export class MassHasSchedulesError extends Error {
  schedules: MassScheduleConflict[];
  linkedEvents: { id: number; name: string }[];

  constructor(body: {
    message?: string;
    schedules?: MassScheduleConflict[];
    linkedEvents?: { id: number; name: string }[];
  }) {
    super(body.message ?? 'Esta missa possui escalas vinculadas.');
    this.name = 'MassHasSchedulesError';
    this.schedules = body.schedules ?? [];
    this.linkedEvents = body.linkedEvents ?? [];
  }
}

interface DeleteMassPayload {
  id: number;
  confirm?: boolean;
}

async function deleteMass({ id, confirm }: DeleteMassPayload): Promise<MassDeleteResult> {
  const res = await fetch(`/api/masses/${id}${confirm ? '?confirm=true' : ''}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    if (res.status === 409) {
      const body = await res.clone().json().catch(() => null);
      if (body?.code === 'MASS_HAS_SCHEDULES') throw new MassHasSchedulesError(body);
    }
    await throwApiError(res, 'Erro ao remover missa.');
  }

  return res.json();
}

export function useDeleteMass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMass,
    onSuccess: (_result, { id }) => {
      queryClient.removeQueries({ queryKey: ['mass', id] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['masses'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
