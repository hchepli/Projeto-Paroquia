import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export async function POST(req: NextRequest) {
  return proxyRequest(req, '/schedule-assignment');
}