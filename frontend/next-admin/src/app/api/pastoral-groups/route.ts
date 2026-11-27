import { NextRequest } from 'next/server';
import { getToken, proxyRequest, proxyToApi } from '@/lib/api-proxy';

export async function GET() {
  const token = await getToken();
  return proxyToApi(token ? '/pastoral-groups/internal' : '/pastoral-groups', { requireAuth: false });
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, '/pastoral-groups');
}