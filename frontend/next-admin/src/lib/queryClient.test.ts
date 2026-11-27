import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sessionExpired = { status: 401, body: { code: 'SESSION_EXPIRED' } };

async function setup(pathname = '/inicio') {
  vi.resetModules(); // zera a variável `redirecting` do módulo
  const assign = vi.fn();
  vi.stubGlobal('window', { location: { pathname, assign } });
  const { makeQueryClient } = await import('@/lib/queryClient');
  return { client: makeQueryClient(), assign };
}

function fire(client: Awaited<ReturnType<typeof setup>>['client'], err: unknown) {
  client.getQueryCache().config.onError?.(err as never, {} as never);
}

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => vi.unstubAllGlobals());

describe('sessão vencida', () => {
  it('redireciona para /login?motivo=sessao', async () => {
    const { client, assign } = await setup();
    fire(client, sessionExpired);
    expect(assign).toHaveBeenCalledWith('/login?motivo=sessao');
  });

  it('redireciona uma vez só, mesmo com vários erros seguidos', async () => {
    const { client, assign } = await setup();
    fire(client, sessionExpired);
    fire(client, sessionExpired);
    fire(client, sessionExpired);
    expect(assign).toHaveBeenCalledTimes(1);
  });

  it('não redireciona se já está em /login', async () => {
    const { client, assign } = await setup('/login');
    fire(client, sessionExpired);
    expect(assign).not.toHaveBeenCalled();
  });

  it('401 com outro code não redireciona', async () => {
    const { client, assign } = await setup();
    fire(client, { status: 401, body: { code: 'OTHER' } });
    expect(assign).not.toHaveBeenCalled();
  });

  it('403 não redireciona', async () => {
    const { client, assign } = await setup();
    fire(client, { status: 403, body: { code: 'SESSION_EXPIRED' } });
    expect(assign).not.toHaveBeenCalled();
  });
});

describe('retry', () => {
  async function retryFn() {
    const { client } = await setup();
    return client.getDefaultOptions().queries!.retry as (n: number, e: unknown) => boolean;
  }

  it.each([400, 401, 403, 404, 409])('não repete em %i', async (status) => {
    expect((await retryFn())(0, { status })).toBe(false);
  });

  it('repete uma vez em 5xx e em falha de rede', async () => {
    const retry = await retryFn();
    expect(retry(0, { status: 503 })).toBe(true);
    expect(retry(0, new Error('network'))).toBe(true);
    expect(retry(1, { status: 503 })).toBe(false);
  });
});