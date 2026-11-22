// src/lib/api-error.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
  }
}

/** O `message` do Nest vem como array nos 400 de validação. */
export async function parseApiError(res: Response, fallback: string) {
  const body = await res.json().catch(() => null);
  const raw =
    body && typeof body === 'object' ? (body as { message?: string | string[] }).message : undefined;
  const message = Array.isArray(raw) ? raw.join(' ') : (raw ?? fallback);
  return new ApiError(message, res.status, body);
}

/**
 * Lê o corpo de um ApiError com o formato que o chamador espera.
 * Devolve null se não for ApiError ou se o corpo não for um objeto.
 * Os campos vêm como opcionais (Partial): o chamador checa antes de usar.
 */
export function errorBody<T extends object>(err: unknown): Partial<T> | null {
  if (!(err instanceof ApiError)) return null;
  const body = err.body;
  return body !== null && typeof body === 'object' ? (body as Partial<T>) : null;
}

export function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}