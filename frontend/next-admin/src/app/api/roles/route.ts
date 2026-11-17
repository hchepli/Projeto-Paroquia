import { NextRequest } from 'next/server';
import { proxyToApi } from '@/lib/api-proxy';

export async function GET() {
  return proxyToApi('/roles');
}

export async function POST(request: NextRequest) {
  return proxyToApi('/roles', { method: 'POST', body: await request.json() });
}