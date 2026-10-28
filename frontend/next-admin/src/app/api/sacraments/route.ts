// src/app/api/sacraments/route.ts
import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/sacraments/backend';

export async function GET() {
  return proxyToBackend('/sacraments', { auth: false });
}

export async function POST(req: NextRequest) {
  return proxyToBackend('/sacraments', { method: 'POST', body: await req.text() });
}
