import { NextRequest, NextResponse } from 'next/server';
import { proxyToApi } from '@/lib/api-proxy';

type Ctx = { params: Promise<{ id: string }> };

async function parseId(ctx: Ctx): Promise<number | null> {
  const n = Number((await ctx.params).id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const INVALID = () => NextResponse.json({ message: 'ID inválido.' }, { status: 400 });

export async function GET(_req: NextRequest, ctx: Ctx) {
  const id = await parseId(ctx);
  if (!id) return INVALID();
  return proxyToApi(`/sacraments/${id}`, { requireAuth: false });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const id = await parseId(ctx);
  if (!id) return INVALID();
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: 'Corpo da requisição inválido.' }, { status: 400 });
  return proxyToApi(`/sacraments/${id}`, { method: 'PATCH', body });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const id = await parseId(ctx);
  if (!id) return INVALID();
  return proxyToApi(`/sacraments/${id}`, { method: 'DELETE' });
}