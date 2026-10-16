// src/app/api/events/[id]/route.ts  (PATCH e DELETE; GET agora é /admin/[id])
import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { forwardError } from '@/lib/api-proxy';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: 'Corpo da requisição inválido.' }, { status: 400 });

  const backendRes = await apiFetch(`/events/${id}`, {
    token,
    method: 'PATCH',
    body: JSON.stringify(body),
  });

  if (!backendRes.ok) return forwardError(backendRes, 'Erro ao atualizar evento.');
  return NextResponse.json(await backendRes.json(), { status: backendRes.status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const qs = searchParams.get('confirm') === 'true' ? '?confirm=true' : '';

  const backendRes = await apiFetch(`/events/${id}${qs}`, { token, method: 'DELETE' });

  // Repassa o corpo inteiro do 409 EVENT_HAS_SCHEDULES (code, schedules, linkedAlbums).
  if (!backendRes.ok) return forwardError(backendRes, 'Erro ao remover evento.');

  const data = await backendRes.json().catch(() => null);
  return NextResponse.json(data ?? { id: Number(id) });
}