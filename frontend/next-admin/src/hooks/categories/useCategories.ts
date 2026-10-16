// src/hooks/categories/useCategories.ts
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Category } from '@/types/categories/category';
import { throwApiError } from '@/lib/errors';

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch('/api/categories');
  if (!res.ok) await throwApiError(res, 'Erro ao buscar categorias.');
  const body = await res.json();
  // Aceita array simples ou { data: [...] }.
  return Array.isArray(body) ? body : (body?.data ?? []);
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
}

/** Só categorias do tipo EVENT (o back rejeita as demais em categoryId). */
export function useEventCategories() {
  const query = useCategories();
  const data = useMemo(() => (query.data ?? []).filter((c) => c.type === 'EVENT'), [query.data]);
  return { ...query, data };
}