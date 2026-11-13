// src/app/api/users/[id]/route.ts
import { NextRequest } from 'next/server';
import { proxyToApi } from '@/lib/api-proxy';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return proxyToApi(`/users/${encodeURIComponent(id)}`);
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return proxyToApi(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: await request.json() });
}