import { useQuery } from '@tanstack/react-query';
import { MassTemplate } from '@/types/masses/mass-template';

async function fetchMassTemplates(): Promise<MassTemplate[]> {
  const res = await fetch('/api/mass-templates');
  if (!res.ok) throw new Error('Erro ao buscar templates de missa.');
  return res.json();
}

export function useMassTemplates() {
  return useQuery({
    queryKey: ['mass-templates'],
    queryFn: fetchMassTemplates,
  });
}