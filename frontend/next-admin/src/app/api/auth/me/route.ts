import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  let backendRes: Response;
  try {
    backendRes = await apiFetch('/auth/me', { token });
  } catch {
    // Back fora do ar: NÃO deslogar o usuário por erro temporário
    return NextResponse.json({ message: 'Serviço indisponível.' }, { status: 503 });
  }

  if (backendRes.status === 401) {
    // Token expirado ou usuário inativado: limpa o cookie para o middleware redirecionar
    const response = NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });
    response.cookies.delete('access_token');
    return response;
  }

  if (!backendRes.ok) {
    return NextResponse.json({ message: 'Serviço indisponível.' }, { status: 503 });
  }

  const user = await backendRes.json();
  return NextResponse.json(user);
}