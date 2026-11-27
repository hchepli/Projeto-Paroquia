import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export async function GET(req: NextRequest) {
  return proxyRequest(req, `/schedules/summary${req.nextUrl.search}`);
}