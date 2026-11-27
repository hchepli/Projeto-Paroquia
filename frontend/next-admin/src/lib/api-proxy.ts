// src/lib/api-proxy.ts
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

export const SESSION_COOKIE = 'access_token';

const MAX_JSON_BYTES = 1 * 1024 * 1024; // 1 MB
const MAX_FORM_BYTES = 10 * 1024 * 1024; // 10 MB (uploads)
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const ID_PATTERN = /^(\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export async function getToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export function sessionExpired() {
  const res = NextResponse.json(
    { code: 'SESSION_EXPIRED', message: 'Sua sessão terminou. Entre de novo.' },
    { status: 401 },
  );
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export function backendUnavailable() {
  return NextResponse.json(
    {
      code: 'BACKEND_UNAVAILABLE',
      message: 'O sistema está fora do ar por um momento. Tente de novo em alguns minutos.',
    },
    { status: 503 },
  );
}

/** Use antes de interpolar um param na URL do back. Devolve null se o id é válido. */
export function invalidId(id: string) {
  return ID_PATTERN.test(id)
    ? null
    : NextResponse.json({ message: 'Endereço inválido.' }, { status: 400 });
}

/** Defesa extra contra CSRF: o Origin de uma escrita precisa ser o próprio site. */
function checkOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin) return null; // chamadas que não vêm de navegador
  const host = req.headers.get('host');
  try {
    if (new URL(origin).host === host) return null;
  } catch {
    /* cai na recusa */
  }
  return NextResponse.json(
    { code: 'BAD_ORIGIN', message: 'Pedido recusado. Recarregue a página e tente de novo.' },
    { status: 403 },
  );
}

/** Teto por Content-Length. Sem o header (chunked), o limite do proxy (Caddy) cobre. */
function checkSize(req: NextRequest, maxBytes: number) {
  const length = Number(req.headers.get('content-length') ?? 0);
  if (length > maxBytes) {
    return NextResponse.json(
      { message: 'O arquivo ou o texto enviado é grande demais.' },
      { status: 413 },
    );
  }
  return null;
}

async function toResponse(res: Response, hadToken: boolean) {
  // Token enviado e o back recusou: sessão vencida ou usuário desativado.
  if (res.status === 401 && hadToken) return sessionExpired();

  // 5xx: nunca repassa texto interno do back.
  if (res.status >= 500) {
    return NextResponse.json(
      { code: 'BACKEND_ERROR', message: 'Algo deu errado no sistema. Tente de novo em instantes.' },
      { status: res.status },
    );
  }

  if (res.status === 204) return new NextResponse(null, { status: 204 });

  // 4xx: repassa o corpo inteiro (a RN016 depende de code/schedules no 409).
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: 'Resposta inválida do servidor.' };
  }
  return NextResponse.json(data, { status: res.status });
}

interface ProxyInit {
  method?: string;
  body?: unknown;
  /** false = rota pública no back (segue sem token). */
  requireAuth?: boolean;
}

/** Mantido compatível com os handlers atuais. */
export async function proxyToApi(path: string, init: ProxyInit = {}) {
  const token = await getToken();
  if (!token && init.requireAuth !== false) return sessionExpired();

  try {
    const res = await apiFetch(path, {
      token,
      method: init.method,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    return await toResponse(res, Boolean(token));
  } catch {
    return backendUnavailable();
  }
}

/**
 * Caminho completo para Route Handlers: sessão, Origin, tamanho, corpo
 * (JSON ou FormData), rede/timeout e filtro de erro, tudo em um lugar.
 */
export async function proxyRequest(req: NextRequest, path: string, opts: { maxBytes?: number } = {}) {
  const token = await getToken();
  if (!token) return sessionExpired();

  const method = req.method;
  let body: string | FormData | undefined;

  if (WRITE_METHODS.has(method)) {
    const badOrigin = checkOrigin(req);
    if (badOrigin) return badOrigin;

    const contentType = req.headers.get('content-type') ?? '';
    const isMultipart = contentType.startsWith('multipart/form-data');

    const tooBig = checkSize(req, opts.maxBytes ?? (isMultipart ? MAX_FORM_BYTES : MAX_JSON_BYTES));
    if (tooBig) return tooBig;

    const invalid = NextResponse.json({ message: 'Corpo da requisição inválido.' }, { status: 400 });
    if (isMultipart) {
      const form = await req.formData().catch(() => null);
      if (!form) return invalid;
      body = form;
    } else if (contentType.includes('application/json')) {
      const json = await req.json().catch(() => undefined);
      if (json === undefined) return invalid;
      body = JSON.stringify(json);
    }
  }

  try {
    const res = await apiFetch(path, { token, method, body });
    return await toResponse(res, true);
  } catch {
    return backendUnavailable();
  }
}
