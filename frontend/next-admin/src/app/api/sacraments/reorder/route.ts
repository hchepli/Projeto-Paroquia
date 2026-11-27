import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export async function PATCH(req: NextRequest) {
  return proxyRequest(req, '/sacraments/reorder');
}