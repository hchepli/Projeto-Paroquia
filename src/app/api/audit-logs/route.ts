import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const backendRes = await apiFetch(`/audit-logs?${searchParams.toString()}`, { token });

  if (!backendRes.ok) {
    const errorBody = await backendRes.json().catch(() => null);
    return NextResponse.json(
      { message: errorBody?.message ?? 'Erro ao buscar log de auditoria.' },
      { status: backendRes.status },
    );
  }

  const data = await backendRes.json();
  return NextResponse.json(data);
}