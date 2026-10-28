// src/app/api/sacraments/reorder/route.ts
import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/sacraments/backend';

export async function PATCH(req: NextRequest) {
  return proxyToBackend('/sacraments/reorder', { method: 'PATCH', body: await req.text() });
}
