import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30s — ajustar depois por hook se precisar
        retry: 1,
      },
    },
  });
}