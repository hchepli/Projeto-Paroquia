// src/app/api/photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const backendRes = await apiFetch('/photos', { token });

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

// IMPORTANTE: encaminha o multipart tal como veio, sem forçar
// 'Content-Type': application/json. Se `apiFetch` setar esse header por
// padrão internamente, isso vai quebrar o upload — vale conferir a
// implementação de apiFetch antes de testar isso em produção.
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