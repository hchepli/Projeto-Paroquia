// src/lib/sacraments/backend.ts  (somente servidor: usado pelos Route Handlers)
// ADAPTE: copie de como seus Route Handlers de eventos (app/api/events/...) leem
// a URL do Nest e o token do usuário. Os dois valores abaixo são suposições.
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const TOKEN_COOKIE = 'access_token'; // <-- ajuste para o nome real do cookie

interface ProxyOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: string;
  auth?: boolean; // false = rota pública (GET)
}

export async function proxyToBackend(path: string, opts: ProxyOptions = {}) {
  const { method = 'GET', body, auth = true } = opts;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = (await cookies()).get(TOKEN_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}${path}`, { method, headers, body, cache: 'no-store' });
    const text = await res.text();
    return new NextResponse(text || null, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return NextResponse.json({ message: 'Servidor indisponível.' }, { status: 502 });
  }
}

export function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}
