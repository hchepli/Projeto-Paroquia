import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy, config } from '@/proxy';

function req(path: string, token?: string) {
  return new NextRequest(`http://localhost:3001${path}`, {
    headers: token ? { cookie: `access_token=${token}` } : {},
  });
}

describe('proxy (middleware)', () => {
  it('sem cookie redireciona para /login', () => {
    const res = proxy(req('/inicio'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  it('/login é livre, mesmo sem cookie', () => {
    const res = proxy(req('/login'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('com cookie deixa passar', () => {
    const res = proxy(req('/missas', 'abc'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  describe('matcher', () => {
    const re = new RegExp(`^${config.matcher[0]}$`);

    it.each(['/api/masses', '/_next/static/chunk.js', '/_next/image', '/favicon.ico'])(
      'exclui %s',
      (path) => expect(re.test(path)).toBe(false),
    );

    it.each(['/', '/inicio', '/missas/nova-missa', '/login'])('inclui %s', (path) =>
      expect(re.test(path)).toBe(true),
    );
  });
});