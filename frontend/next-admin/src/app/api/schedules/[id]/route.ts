import { NextRequest } from 'next/server';
import { proxyToApi } from '@/lib/api-proxy';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return proxyToApi(`/schedules/${encodeURIComponent(id)}`);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return proxyToApi(`/schedules/${encodeURIComponent(id)}`, { method: 'DELETE' });
}