import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { message: 'E-mail e senha são obrigatórios.' },
      { status: 400 },
    );
  }

  const backendRes = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: body.email, password: body.password }),
  });

  if (!backendRes.ok) {
    // Repassa a mensagem genérica do back (RN015 / UC007 3a:
    // não revelar se o erro é de e-mail ou senha).
    const errorBody = await backendRes.json().catch(() => null);
    return NextResponse.json(
      { message: errorBody?.message ?? 'Credenciais inválidas.' },
      { status: backendRes.status },
    );
  }

  const { access_token } = await backendRes.json();

  const response = NextResponse.json({ ok: true });

  response.cookies.set('access_token', access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // TODO: ajustar quando o tempo de expiração do JWT for definido
    // (Dia 3 do roadmap-auth.md ainda está em aberto sobre isso)
    maxAge: 60 * 60 * 8, // 8h
  });

  return response;
}