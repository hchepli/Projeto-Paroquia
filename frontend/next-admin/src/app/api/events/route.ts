// src/app/api/events/route.ts  (só POST; o GET público era código morto no admin)
import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { forwardError } from '@/lib/api-proxy';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: 'Corpo da requisição inválido.' }, { status: 400 });

  const backendRes = await apiFetch('/events', {
    token,
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!backendRes.ok) return forwardError(backendRes, 'Erro ao criar evento.');
  return NextResponse.json(await backendRes.json(), { status: backendRes.status });
}