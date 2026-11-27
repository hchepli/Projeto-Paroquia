import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

const EXPIRED = { code: 'SESSION_EXPIRED', message: 'Sua sessão terminou. Entre de novo.' };

export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return NextResponse.json(EXPIRED, { status: 401 });

  let backendRes: Response;
  try {
    backendRes = await apiFetch('/auth/me', { token });
  } catch {
    // Back fora do ar: NÃO deslogar por erro temporário.
    return NextResponse.json(
      { code: 'BACKEND_UNAVAILABLE', message: 'O sistema está fora do ar por um momento.' },
      { status: 503 },
    );
  }

  if (backendRes.status === 401) {
    const response = NextResponse.json(EXPIRED, { status: 401 });
    response.cookies.delete('access_token');
    return response;
  }

  if (!backendRes.ok) {
    return NextResponse.json(
      { code: 'BACKEND_UNAVAILABLE', message: 'O sistema está fora do ar por um momento.' },
      { status: 503 },
    );
  }

  return NextResponse.json(await backendRes.json());
}