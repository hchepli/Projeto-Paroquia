// src/app/api/attendance-confirmations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { forwardError } from '@/lib/api-proxy';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;
  const backendRes = await apiFetch(`/attendance-confirmations/${id}`, { token });

  if (!backendRes.ok) return forwardError(backendRes, 'Erro ao buscar confirmação.');
  return NextResponse.json(await backendRes.json());
}

// LGPD: exclusão definitiva de uma confirmação.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;
  const backendRes = await apiFetch(`/attendance-confirmations/${id}`, { token, method: 'DELETE' });

  if (!backendRes.ok) return forwardError(backendRes, 'Erro ao excluir confirmação.');
  return NextResponse.json(await backendRes.json().catch(() => ({ id })));
}