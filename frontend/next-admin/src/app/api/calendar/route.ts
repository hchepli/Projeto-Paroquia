import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  if (!searchParams.get('start') || !searchParams.get('end')) {
    return NextResponse.json(
      { message: 'Informe o período (início e fim).' },
      { status: 400 },
    );
  }
  return proxyRequest(req, `/calendar${req.nextUrl.search}`);
}