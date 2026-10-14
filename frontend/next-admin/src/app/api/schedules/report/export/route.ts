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
  const res = await apiFetch(`/schedules/report/export${search ? `?${search}` : ''}`, { token });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return NextResponse.json(body ?? { message: 'Erro ao exportar relatório.' }, {
      status: res.status,
    });
  }

  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
  const contentDisposition = res.headers.get('content-disposition') ?? 'attachment';

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': contentDisposition,
    },
  });
}