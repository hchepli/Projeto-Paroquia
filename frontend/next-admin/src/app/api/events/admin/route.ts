// src/app/api/events/admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { forwardError } from '@/lib/api-proxy';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const backendRes = await apiFetch(`/events/admin?${searchParams.toString()}`, { token });

  if (!backendRes.ok) return forwardError(backendRes, 'Erro ao buscar eventos.');
  return NextResponse.json(await backendRes.json());
}