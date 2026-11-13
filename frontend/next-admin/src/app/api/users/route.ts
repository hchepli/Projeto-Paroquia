// src/app/api/users/route.ts
import { NextRequest } from 'next/server';
import { proxyToApi } from '@/lib/api-proxy';

export async function GET() {
  return proxyToApi('/users');
}

export async function POST(request: NextRequest) {
  return proxyToApi('/users', { method: 'POST', body: await request.json() });
}