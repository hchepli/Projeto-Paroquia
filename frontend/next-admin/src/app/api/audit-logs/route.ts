import { NextRequest } from 'next/server';
import { proxyToApi } from '@/lib/api-proxy';

export async function GET(req: NextRequest) {
  const { search } = new URL(req.url);
  return proxyToApi(`/audit-logs${search}`);
}