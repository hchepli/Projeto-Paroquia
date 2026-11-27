import { NextRequest } from 'next/server';
import { invalidId, proxyRequest } from '@/lib/api-proxy';

type Ctx = { params: Promise<{ id: string }> };

async function handle(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const bad = invalidId(id);
  if (bad) return bad;
  // GET usa a rota interna (com defaultRole); PATCH/DELETE a rota normal.
  const path = req.method === 'GET' ? `/pastoral-groups/internal/${id}` : `/pastoral-groups/${id}`;
  return proxyRequest(req, path);
}

export { handle as GET, handle as PATCH, handle as DELETE };