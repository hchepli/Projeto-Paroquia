// src/hooks/masses/useMassTemplates.ts
import { useQuery } from '@tanstack/react-query';
import { MassTemplate } from '@/types/masses/mass-template';
import { throwApiError } from '@/lib/errors';

async function fetchMassTemplates(): Promise<MassTemplate[]> {
  const res = await fetch('/api/mass-templates');
  if (!res.ok) await throwApiError(res, 'Erro ao buscar templates de missa.');
  return res.json();
}

export function useMassTemplates(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['mass-templates'],
    queryFn: fetchMassTemplates,
    enabled: options.enabled ?? true,
  });
}
