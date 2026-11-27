import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export async function GET(req: NextRequest) {
  return proxyRequest(req, `/masses/without-pastoral${req.nextUrl.search}`);
}