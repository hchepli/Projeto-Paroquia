import { NextRequest } from 'next/server';
import { proxyRequest, proxyToApi } from '@/lib/api-proxy';

export async function GET() {
  return proxyToApi('/sacraments', { requireAuth: false });
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, '/sacraments');
}