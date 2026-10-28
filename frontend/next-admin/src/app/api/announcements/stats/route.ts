import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const backendRes = await apiFetch('/announcements/admin/stats', { token });
  const data = await backendRes.json().catch(() => null);

  if (!backendRes.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Erro ao buscar estatísticas.' },
      { status: backendRes.status },
    );
  }
  return NextResponse.json(data);
}