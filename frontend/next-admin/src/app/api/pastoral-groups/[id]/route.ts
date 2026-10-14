// src/app/api/pastoral-groups/[id]/route.ts
import { NextRequest } from 'next/server';
import { proxyToApi } from '@/lib/api-proxy';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return proxyToApi(`/pastoral-groups/internal/${encodeURIComponent(id)}`);
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return proxyToApi(`/pastoral-groups/${encodeURIComponent(id)}`, { method: 'PATCH', body: await request.json() });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return proxyToApi(`/pastoral-groups/${encodeURIComponent(id)}`, { method: 'DELETE' });
}