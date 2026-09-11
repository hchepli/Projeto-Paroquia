// src/hooks/volunteers/useVolunteers.ts
import { useQuery } from '@tanstack/react-query';
import { Volunteer } from '@/types/volunteers/volunteer';

async function fetchVolunteers(): Promise<Volunteer[]> {
  const res = await fetch('/api/volunteers');
  if (!res.ok) throw new Error('Erro ao buscar voluntários.');
  return res.json();
}

export function useVolunteers() {
  return useQuery({
    queryKey: ['volunteers'],
    queryFn: fetchVolunteers,
  });
}