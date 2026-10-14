// src/lib/api-error.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: any,
  ) {
    super(message);
  }
}

/** O `message` do Nest vem como array nos 400 de validação. */
export async function parseApiError(res: Response, fallback: string) {
  const body = await res.json().catch(() => null);
  const raw = body?.message;
  const message = Array.isArray(raw) ? raw.join(' ') : (raw ?? fallback);
  return new ApiError(message, res.status, body);
}

export function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}