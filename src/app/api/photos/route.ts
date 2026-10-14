// src/app/api/photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  // Repassa o filtro opcional ?albumId= para o backend.
  const albumId = req.nextUrl.searchParams.get('albumId');
  const qs = albumId ? `?albumId=${encodeURIComponent(albumId)}` : '';

  const backendRes = await apiFetch(`/photos${qs}`, { token });

  if (!backendRes.ok) {
    const errorBody = await backendRes.json().catch(() => null);
    return NextResponse.json(
      { message: errorBody?.message ?? 'Erro ao buscar fotos.' },
      { status: backendRes.status },
    );
  }

  const data = await backendRes.json();
  return NextResponse.json(data);
}

// Encaminha o multipart tal como veio. O apiFetch agora omite o
// Content-Type quando o body é FormData.
export async function POST(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const incomingForm = await req.formData();

  const backendRes = await apiFetch('/photos', {
    token,
    method: 'POST',
    body: incomingForm,
  });

  const data = await backendRes.json().catch(() => null);

  if (!backendRes.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Erro ao enviar foto.' },
      { status: backendRes.status },
    );
  }

  return NextResponse.json(data, { status: backendRes.status });
}
