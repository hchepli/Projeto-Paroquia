import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const backendRes = await apiFetch(`/announcements/${id}`, {
    token,
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await backendRes.json().catch(() => null);
  if (!backendRes.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Erro ao atualizar comunicado.' },
      { status: backendRes.status },
    );
  }
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await params;
  const backendRes = await apiFetch(`/announcements/${id}`, { token, method: 'DELETE' });
  const data = await backendRes.json().catch(() => null);

  if (!backendRes.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Erro ao remover comunicado.' },
      { status: backendRes.status },
    );
  }
  return NextResponse.json(data ?? { ok: true });
}