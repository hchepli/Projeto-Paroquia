// src/app/api/pastoral-groups/route.ts
import { NextRequest } from 'next/server';
import { getToken, proxyToApi } from '@/lib/api-proxy';

// Com token (admin): lista interna, com defaultRole. Sem token (site público): só campos públicos.
export async function GET() {
  const token = await getToken();
  return proxyToApi(token ? '/pastoral-groups/internal' : '/pastoral-groups', { requireAuth: false });
}

export async function POST(request: NextRequest) {
  return proxyToApi('/pastoral-groups', { method: 'POST', body: await request.json() });
}