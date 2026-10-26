import { NextRequest, NextResponse } from 'next/server';
import { proxyToApi } from '@/lib/api-proxy';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ message: 'Corpo da requisição inválido.' }, { status: 400 });
  return proxyToApi('/schedule-assignment', { method: 'POST', body });
}