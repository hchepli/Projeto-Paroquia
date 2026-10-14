// src/app/api/volunteers/[id]/route.ts
import { NextRequest } from 'next/server';
import { proxyToApi } from '@/lib/api-proxy';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return proxyToApi(`/volunteers/${encodeURIComponent(id)}`);
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return proxyToApi(`/volunteers/${encodeURIComponent(id)}`, { method: 'PATCH', body: await request.json() });
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const confirm = request.nextUrl.searchParams.get('confirm') === 'true';
  return proxyToApi(`/volunteers/${encodeURIComponent(id)}${confirm ? '?confirm=true' : ''}`, { method: 'DELETE' });
}