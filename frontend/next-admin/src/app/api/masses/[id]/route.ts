import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await params;

  const backendRes = await apiFetch(`/masses/${id}`, { token });

  if (!backendRes.ok) {
    const errorBody = await backendRes.json().catch(() => null);
    return NextResponse.json(
      { message: errorBody?.message ?? 'Erro ao buscar missa.' },
      { status: backendRes.status },
    );
  }

  const data = await backendRes.json();
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const backendRes = await apiFetch(`/masses/${id}`, {
    token,
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await backendRes.json().catch(() => null);

  if (!backendRes.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Erro ao atualizar missa.' },
      { status: backendRes.status },
    );
  }

  return NextResponse.json(data, { status: backendRes.status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const qs = searchParams.get('confirm') === 'true' ? '?confirm=true' : '';

  const backendRes = await apiFetch(`/masses/${id}${qs}`, { token, method: 'DELETE' });
  const data = await backendRes.json().catch(() => null);

  if (!backendRes.ok) {
    // RN016: repassa o corpo inteiro do 409 (code, schedules, linkedEvents)
    if (backendRes.status === 409 && data?.code === 'MASS_HAS_SCHEDULES') {
      return NextResponse.json(data, { status: 409 });
    }
    return NextResponse.json(
      { message: data?.message ?? 'Erro ao remover missa.' },
      { status: backendRes.status },
    );
  }

  return NextResponse.json(data ?? { ok: true });
}
