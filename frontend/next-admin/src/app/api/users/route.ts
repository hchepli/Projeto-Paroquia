import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export async function GET(req: NextRequest) {
  return proxyRequest(req, `/users${req.nextUrl.search}`);
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, '/users');
}