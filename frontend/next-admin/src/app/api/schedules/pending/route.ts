// src/app/api/schedules/pending/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiFetch } from '@/lib/api';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.toString();
  const res = await apiFetch(`/schedules/pending${search ? `?${search}` : ''}`, { token });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}