import { NextRequest, NextResponse } from 'next/server';
import { proxyToApi } from '@/lib/api-proxy';

export async function GET() {
  return proxyToApi('/sacraments', { requireAuth: false });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: 'Corpo da requisição inválido.' }, { status: 400 });
  return proxyToApi('/sacraments', { method: 'POST', body });
}