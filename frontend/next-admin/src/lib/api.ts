const BASE_URL = process.env.NEST_API_URL;

const DEFAULT_TIMEOUT_MS = 10_000;
const UPLOAD_TIMEOUT_MS = 60_000;

type FetchOptions = RequestInit & {
  token?: string;
};

export async function apiFetch(path: string, options: FetchOptions = {}) {
  if (!BASE_URL) {
    // Cai no catch dos handlers e vira 503 simples para o usuário.
    throw new Error('NEST_API_URL não está configurada.');
  }

  const { token, headers, signal, ...rest } = options;

  // Com FormData o fetch gera o Content-Type (multipart + boundary) sozinho.
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData;

  return fetch(`${BASE_URL}${path}`, {
    ...rest,
    signal: signal ?? AbortSignal.timeout(isFormData ? UPLOAD_TIMEOUT_MS : DEFAULT_TIMEOUT_MS),
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
}