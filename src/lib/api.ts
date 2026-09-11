const BASE_URL = process.env.NEST_API_URL;

type FetchOptions = RequestInit & {
  token?: string;
};

export async function apiFetch(path: string, options: FetchOptions = {}) {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  return res;
}