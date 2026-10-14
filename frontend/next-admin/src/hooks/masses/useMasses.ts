// src/hooks/masses/useMasses.ts
import { useQuery } from '@tanstack/react-query';
import { Mass } from '@/types/masses/masses';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UseMassesParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

async function fetchMasses(params: UseMassesParams = {}): Promise<PaginatedResult<Mass>> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });

  const res = await fetch(`/api/masses?${query.toString()}`);
  if (!res.ok) throw new Error('Erro ao buscar missas.');
  return res.json();
}

export function useMasses(params: UseMassesParams = {}) {
  return useQuery({
    queryKey: ['masses', params],
    queryFn: () => fetchMasses(params),
  });
}