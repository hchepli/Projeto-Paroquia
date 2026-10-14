import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

const DEFAULT_MAX_AGE = 60 * 60 * 8; // fallback; o valor real vem do Nest (expires_in)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { message: 'E-mail e senha são obrigatórios.' },
      { status: 400 },
    );
  }

  let backendRes: Response;
  try {
    backendRes = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: body.email, password: body.password }),
    });
  } catch {
    return NextResponse.json(
      { message: 'Serviço indisponível no momento. Tente novamente em instantes.' },
      { status: 503 },
    );
  }

  if (!backendRes.ok) {
    if (backendRes.status === 429) {
      return NextResponse.json(
        { message: 'Muitas tentativas. Aguarde 1 minuto e tente novamente.' },
        { status: 429 },
      );
    }

    if (backendRes.status === 401) {
      // Repassa a mensagem do back: genérica para credenciais (UC007 3a)
      // ou específica para conta inativa (UC007 3b).
      const errorBody = await backendRes.json().catch(() => null);
      return NextResponse.json(
        { message: errorBody?.message ?? 'E-mail ou senha incorretos.' },
        { status: 401 },
      );
    }

    if (backendRes.status === 400) {
      return NextResponse.json(
        { message: 'Informe um e-mail e uma senha válidos.' },
        { status: 400 },
      );
    }

    // 5xx e demais: não expõe detalhe interno
    return NextResponse.json(
      { message: 'Não foi possível entrar agora. Tente novamente em instantes.' },
      { status: 503 },
    );
  }

  const { access_token, expires_in } = await backendRes.json();

  const response = NextResponse.json({ ok: true });

  response.cookies.set('access_token', access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // Mesma fonte do expiresIn do JWT (auth.constants.ts no Nest)
    maxAge: expires_in ?? DEFAULT_MAX_AGE,
  });

  return response;
}