import { NextRequest, NextResponse } from 'next/server';
import { proxyToApi } from '@/lib/api-proxy';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ message: 'Corpo da requisição inválido.' }, { status: 400 });
  return proxyToApi(`/schedule-assignment/${encodeURIComponent(id)}`, { method: 'PATCH', body });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return proxyToApi(`/schedule-assignment/${encodeURIComponent(id)}`, { method: 'DELETE' });
}