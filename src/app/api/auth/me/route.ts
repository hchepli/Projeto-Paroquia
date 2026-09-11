import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const backendRes = await apiFetch('/auth/me', { token });

  if (!backendRes.ok) {
    return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });
  }

  const user = await backendRes.json();
  return NextResponse.json(user);
}