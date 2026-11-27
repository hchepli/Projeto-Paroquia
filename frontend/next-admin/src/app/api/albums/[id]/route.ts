import { NextRequest } from 'next/server';
import { invalidId, proxyRequest } from '@/lib/api-proxy';

type Ctx = { params: Promise<{ id: string }> };

async function handle(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const bad = invalidId(id);
  if (bad) return bad;
  return proxyRequest(req, `/albums/${id}`);
}

export { handle as GET, handle as PATCH, handle as DELETE };