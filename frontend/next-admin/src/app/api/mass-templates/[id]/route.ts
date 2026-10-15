import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const qs = searchParams.get('removeFuture') === 'true' ? '?removeFuture=true' : '';

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const backendRes = await apiFetch(`/mass-templates/${id}${qs}`, {
    token,
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await backendRes.json().catch(() => null);

  if (!backendRes.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Erro ao atualizar template.' },
      { status: backendRes.status },
    );
  }

  return NextResponse.json(data);
}
