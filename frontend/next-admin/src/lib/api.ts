const BASE_URL = process.env.NEST_API_URL;

type FetchOptions = RequestInit & {
  token?: string;
};

export async function apiFetch(path: string, options: FetchOptions = {}) {
  const { token, headers, ...rest } = options;

  // Com FormData (upload), o Content-Type NÃO pode ser fixado: o fetch
  // precisa gerar "multipart/form-data; boundary=..." sozinho.
  // Para os demais casos (JSON), mantém o default de antes.
  // Atenção: ao enviar FormData, não passe "Content-Type" em `headers`.
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  return res;
}
