import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export async function GET(req: NextRequest) {
  return proxyRequest(req, `/attendance-confirmations${req.nextUrl.search}`);
}