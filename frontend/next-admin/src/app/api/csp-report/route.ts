import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const text = (await req.text().catch(() => '')).slice(0, 2000);
  if (text) console.warn('[csp-report]', text);
  return new NextResponse(null, { status: 204 });
}