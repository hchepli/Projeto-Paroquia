// src/app/api/sacraments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseId, proxyToBackend } from '@/lib/sacraments/backend';

type Ctx = { params: Promise<{ id: string }> };

async function withId(ctx: Ctx, run: (id: number) => Promise<Response>) {
  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ message: 'ID inválido.' }, { status: 400 });
  return run(id);
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  return withId(ctx, (id) => proxyToBackend(`/sacraments/${id}`, { auth: false }));
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const body = await req.text();
  return withId(ctx, (id) => proxyToBackend(`/sacraments/${id}`, { method: 'PATCH', body }));
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  return withId(ctx, (id) => proxyToBackend(`/sacraments/${id}`, { method: 'DELETE' }));
}
