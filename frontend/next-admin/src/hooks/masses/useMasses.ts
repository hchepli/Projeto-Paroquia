// src/hooks/masses/useMasses.ts
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Mass } from '@/types/masses/masses';
import { throwApiError } from '@/lib/errors';

export interface PaginatedResult<T> {
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
  sortBy?: string;
  order?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

async function fetchMasses(params: UseMassesParams = {}): Promise<PaginatedResult<Mass>> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });

  const qs = query.toString();
  const res = await fetch(`/api/masses${qs ? `?${qs}` : ''}`);
  if (!res.ok) await throwApiError(res, 'Erro ao buscar missas.');
  return res.json();
}

export function useMasses(params: UseMassesParams = {}) {
  return useQuery({
    queryKey: ['masses', params],
    queryFn: () => fetchMasses(params),
    // Trocar de página/filtro mantém a lista anterior até chegar a nova.
    placeholderData: keepPreviousData,
  });
}