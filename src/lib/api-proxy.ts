// src/lib/api-proxy.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function getToken() {
  return (await cookies()).get('access_token')?.value;
}

interface ProxyInit {
  method?: string;
  body?: unknown;
  /** false = rota pública no back (segue sem token). */
  requireAuth?: boolean;
}

export async function proxyToApi(path: string, init: ProxyInit = {}) {
  const token = await getToken();
  if (!token && init.requireAuth !== false) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  }

  const res = await apiFetch(path, {
    token,
    method: init.method,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: 'Resposta inválida do servidor.' };
  }
  return NextResponse.json(data, { status: res.status });
}