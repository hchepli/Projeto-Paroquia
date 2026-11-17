import { NextRequest, NextResponse } from 'next/server';
import { proxyToApi } from '@/lib/api-proxy';

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: 'Corpo da requisição inválido.' }, { status: 400 });
  return proxyToApi('/sacraments/reorder', { method: 'PATCH', body });
}