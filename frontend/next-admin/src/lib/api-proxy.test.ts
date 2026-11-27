import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }));

import { cookies } from 'next/headers';
import { apiFetch } from '@/lib/api';
import { invalidId, proxyRequest } from '@/lib/api-proxy';

const HOST = 'localhost:3001';

function withToken(token?: string) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === 'access_token' && token ? { value: token } : undefined),
  } as never);
}

function post(headers: Record<string, string> = {}, body: unknown = { a: 1 }) {
  return new NextRequest(`http://${HOST}/api/masses`, {
    method: 'POST',
    headers: {
      host: HOST,
      origin: `http://${HOST}`,
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  withToken('valid-token');
});

describe('proxyRequest', () => {
  it('sem cookie devolve SESSION_EXPIRED e não chama o back', async () => {
    withToken(undefined);
    const res = await proxyRequest(post(), '/masses');
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('SESSION_EXPIRED');
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('401 do back limpa o cookie de sessão', async () => {
    vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 401 }));
    const res = await proxyRequest(post(), '/masses');
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('SESSION_EXPIRED');
    expect(res.headers.get('set-cookie')).toMatch(/access_token=;/);
  });

  it('Origin de outro site devolve 403 e não chama o back', async () => {
    const res = await proxyRequest(post({ origin: 'https://evil.example' }), '/masses');
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('BAD_ORIGIN');
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('sem Origin (chamada fora do navegador) é aceito', async () => {
    vi.mocked(apiFetch).mockResolvedValue(Response.json({ ok: true }, { status: 201 }));
    const req = new NextRequest(`http://${HOST}/api/masses`, {
      method: 'POST',
      headers: { host: HOST, 'content-type': 'application/json' },
      body: JSON.stringify({ a: 1 }),
    });
    const res = await proxyRequest(req, '/masses');
    expect(res.status).toBe(201);
  });

  it('corpo JSON acima de 1 MB devolve 413', async () => {
    const res = await proxyRequest(
      post({ 'content-length': String(2 * 1024 * 1024) }),
      '/masses',
    );
    expect(res.status).toBe(413);
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('rede caída devolve 503 BACKEND_UNAVAILABLE', async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error('ECONNREFUSED'));
    const res = await proxyRequest(post(), '/masses');
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe('BACKEND_UNAVAILABLE');
  });

  it('5xx vira mensagem genérica e não vaza texto interno', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response('PrismaClientKnownRequestError: secret stack', { status: 500 }),
    );
    const res = await proxyRequest(post(), '/masses');
    const text = JSON.stringify(await res.json());
    expect(res.status).toBe(500);
    expect(text).toContain('BACKEND_ERROR');
    expect(text).not.toContain('Prisma');
    expect(text).not.toContain('secret');
  });

  it('409 repassa o corpo inteiro (RN016)', async () => {
    const body = { code: 'HAS_SCHEDULES', schedules: [{ id: 'x' }] };
    vi.mocked(apiFetch).mockResolvedValue(Response.json(body, { status: 409 }));
    const res = await proxyRequest(post(), '/masses/1');
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(body);
  });

  it('JSON inválido no corpo devolve 400', async () => {
    const req = new NextRequest(`http://${HOST}/api/masses`, {
      method: 'POST',
      headers: { host: HOST, origin: `http://${HOST}`, 'content-type': 'application/json' },
      body: '{quebrado',
    });
    const res = await proxyRequest(req, '/masses');
    expect(res.status).toBe(400);
    expect(apiFetch).not.toHaveBeenCalled();
  });
});

describe('invalidId', () => {
  it.each(['1', '42', '123e4567-e89b-12d3-a456-426614174000'])('aceita %s', (id) =>
    expect(invalidId(id)).toBeNull(),
  );

  it.each(['..%2Fusers', '../users', '1/../../users', 'abc', '', '1;drop'])(
    'recusa %s com 400',
    (id) => expect(invalidId(id)?.status).toBe(400),
  );
});