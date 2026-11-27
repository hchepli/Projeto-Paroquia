import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

// Detecta pelo formato, não por instanceof: existem duas classes ApiError.
function readError(err: unknown) {
  if (typeof err !== 'object' || err === null) return { status: undefined, code: undefined };
  const e = err as { status?: unknown; body?: unknown };
  const code = (e.body as { code?: unknown } | null)?.code;
  return { status: typeof e.status === 'number' ? e.status : undefined, code };
}

let redirecting = false;

function handleSessionExpired(err: unknown) {
  const { status, code } = readError(err);
  if (status !== 401 || code !== 'SESSION_EXPIRED') return;
  if (typeof window === 'undefined' || redirecting) return;
  if (window.location.pathname.startsWith('/login')) return;
  redirecting = true;
  // Navegação completa: zera o cache e qualquer dado da sessão anterior.
  window.location.assign('/login?motivo=sessao');
}

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleSessionExpired }),
    mutationCache: new MutationCache({ onError: handleSessionExpired }),
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        // Erro 4xx não melhora repetindo; só tenta de novo falha de rede/5xx.
        retry: (failureCount, err) => {
          const { status } = readError(err);
          if (status !== undefined && status >= 400 && status < 500) return false;
          return failureCount < 1;
        },
      },
    },
  });
}