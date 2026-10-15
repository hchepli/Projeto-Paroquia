// src/lib/errors.ts
// Erro HTTP com status e corpo originais (o back manda `message` como string
// ou como array de strings nos 400 de validação).

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    if (Array.isArray(message)) {
      const text = message.filter((m): m is string => typeof m === 'string').join('; ');
      if (text) return text;
    }
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

/** Lê o corpo da resposta com erro e lança ApiError com mensagem legível. */
export async function throwApiError(res: Response, fallback: string): Promise<never> {
  const body = await res.json().catch(() => null);
  throw new ApiError(extractMessage(body, fallback), res.status, body);
}

export function getErrorMessage(err: unknown, fallback = 'Erro inesperado.'): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
