// src/app/api/events/admin/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { forwardError } from '@/lib/api-proxy';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;
  const backendRes = await apiFetch(`/events/admin/${id}`, { token });

  if (!backendRes.ok) return forwardError(backendRes, 'Erro ao buscar evento.');
  return NextResponse.json(await backendRes.json());
}