import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { backendUnavailable, getToken, sessionExpired } from '@/lib/api-proxy';

export async function GET(req: NextRequest) {
  const token = await getToken();
  if (!token) return sessionExpired();

  let res: Response;
  try {
    res = await apiFetch(`/schedules/report/export${req.nextUrl.search}`, {
      token,
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return backendUnavailable();
  }

  if (res.status === 401) return sessionExpired();

  if (!res.ok) {
    if (res.status >= 500) {
      return NextResponse.json(
        { code: 'BACKEND_ERROR', message: 'Não foi possível gerar o relatório agora. Tente de novo.' },
        { status: res.status },
      );
    }
    const body = await res.json().catch(() => null);
    return NextResponse.json(body ?? { message: 'Erro ao exportar relatório.' }, { status: res.status });
  }

  return new NextResponse(await res.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream',
      'Content-Disposition': res.headers.get('content-disposition') ?? 'attachment',
    },
  });
}