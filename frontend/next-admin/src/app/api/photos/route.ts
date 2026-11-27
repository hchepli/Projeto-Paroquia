import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export async function GET(req: NextRequest) {
  return proxyRequest(req, `/photos${req.nextUrl.search}`);
}

// Upload multipart: o helper trata o FormData, o limite de 10 MB e o timeout de 60 s.
export async function POST(req: NextRequest) {
  return proxyRequest(req, '/photos');
}