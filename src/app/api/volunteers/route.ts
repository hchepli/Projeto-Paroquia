// src/app/api/volunteers/route.ts
import { NextRequest } from 'next/server';
import { proxyToApi } from '@/lib/api-proxy';

export async function GET(request: NextRequest) {
  const pastoralGroupId = request.nextUrl.searchParams.get('pastoralGroupId');
  const qs = pastoralGroupId ? `?pastoralGroupId=${encodeURIComponent(pastoralGroupId)}` : '';
  return proxyToApi(`/volunteers${qs}`);
}

export async function POST(request: NextRequest) {
  return proxyToApi('/volunteers', { method: 'POST', body: await request.json() });
}