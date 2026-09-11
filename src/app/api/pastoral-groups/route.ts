// src/app/api/pastoral-groups/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiFetch } from '@/lib/api';

export async function GET(_request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  // Endpoint é @Public() no backend, mas passamos o token quando existir
  // (mesmo padrão do resto do projeto).
  const res = await apiFetch('/pastoral-groups', token ? { token } : {});
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}