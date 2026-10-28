// src/lib/sacraments/api.ts
// fetch do browser -> Route Handlers do Next (/api/sacraments). Se você já tem um
// client HTTP padrão (usado nos hooks de eventos), pode trocar por ele.
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function sacramentsFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });

  const text = await res.text();
  const body = text ? safeJson(text) : null;

  if (!res.ok) {
    const raw = (body as { message?: string | string[] } | null)?.message;
    const message = Array.isArray(raw) ? raw.join(' ') : raw;
    throw new ApiError(message || `Erro ${res.status}`, res.status);
  }
  return body as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
