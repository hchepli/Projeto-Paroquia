import { NextRequest } from 'next/server';
import { invalidId, proxyRequest } from '@/lib/api-proxy';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const bad = invalidId(id);
  if (bad) return bad;
  const qs = req.nextUrl.searchParams.get('removeFuture') === 'true' ? '?removeFuture=true' : '';
  return proxyRequest(req, `/mass-templates/${id}${qs}`);
}