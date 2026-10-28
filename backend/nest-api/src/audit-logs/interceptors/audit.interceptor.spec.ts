// src/audit-logs/interceptors/audit.interceptor.spec.ts
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, lastValueFrom } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';

const flush = () => new Promise((r) => setImmediate(r));

const makeContext = (request: any) =>
  ({
    getHandler: () => 'handler',
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('AuditInterceptor', () => {
  let reflector: Reflector;
  let auditLogs: { create: jest.Mock };
  let prisma: any;
  let interceptor: AuditInterceptor;

  beforeEach(() => {
    reflector = new Reflector();
    auditLogs = { create: jest.fn().mockResolvedValue(undefined) };
    prisma = {
      user: { findUnique: jest.fn() },
      role: { findUnique: jest.fn() },
    };
    interceptor = new AuditInterceptor(reflector, auditLogs as any, prisma);
    jest.spyOn(interceptor['logger'], 'error').mockImplementation();
  });

  const setEntity = (name: string | undefined) =>
    jest.spyOn(reflector, 'get').mockReturnValue(name);
  const handler = (value: any): CallHandler => ({ handle: () => of(value) });

  it('ignora rota sem @Auditable', async () => {
    setEntity(undefined);
    await lastValueFrom(
      await interceptor.intercept(
        makeContext({ method: 'POST', user: { userId: 'u' } }),
        handler({ id: 1 }),
      ),
    );
    await flush();
    expect(auditLogs.create).not.toHaveBeenCalled();
  });

  it('não loga sem usuário autenticado', async () => {
    setEntity('User');
    await lastValueFrom(
      await interceptor.intercept(
        makeContext({ method: 'POST', params: {} }),
        handler({ id: 'x' }),
      ),
    );
    await flush();
    expect(auditLogs.create).not.toHaveBeenCalled();
  });

  it('CREATE: grava dados novos sem passwordHash', async () => {
    setEntity('User');
    const req = { method: 'POST', user: { userId: 'admin' }, params: {} };
    await lastValueFrom(
      await interceptor.intercept(
        makeContext(req),
        handler({
          id: 'u1',
          name: 'A',
          passwordHash: 'SEGREDO',
          role: { name: 'X' },
        }),
      ),
    );
    await flush();
    const arg = auditLogs.create.mock.calls[0][0];
    expect(arg).toMatchObject({
      userId: 'admin',
      action: 'CREATE',
      entity: 'User',
      entityId: 'u1',
    });
    expect(JSON.stringify(arg)).not.toContain('SEGREDO');
  });

  it('UPDATE: busca o registro antes e remove o hash dos dados anteriores', async () => {
    setEntity('User');
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      name: 'Antigo',
      passwordHash: 'SEGREDO',
    });
    const req = {
      method: 'PATCH',
      user: { userId: 'admin' },
      params: { id: 'u1' },
    };
    await lastValueFrom(
      await interceptor.intercept(
        makeContext(req),
        handler({ id: 'u1', name: 'Novo' }),
      ),
    );
    await flush();
    const arg = auditLogs.create.mock.calls[0][0];
    expect(arg.action).toBe('UPDATE');
    expect(arg.previousData).toEqual({ id: 'u1', name: 'Antigo' });
    expect(arg.newData).toEqual({ id: 'u1', name: 'Novo' });
  });

  it('converte id numérico da URL para number ao buscar o registro anterior (models Int)', async () => {
    setEntity('Role');
    prisma.role.findUnique.mockResolvedValue({ id: 5 });
    const req = {
      method: 'PATCH',
      user: { userId: 'admin' },
      params: { id: '5' },
    };
    await lastValueFrom(
      await interceptor.intercept(makeContext(req), handler({ id: 5 })),
    );
    expect(prisma.role.findUnique).toHaveBeenCalledWith({ where: { id: 5 } });
  });

  it('DELETE: sem dados novos', async () => {
    setEntity('User');
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', name: 'X' });
    const req = {
      method: 'DELETE',
      user: { userId: 'admin' },
      params: { id: 'u1' },
    };
    await lastValueFrom(
      await interceptor.intercept(makeContext(req), handler({ id: 'u1' })),
    );
    await flush();
    const arg = auditLogs.create.mock.calls[0][0];
    expect(arg.action).toBe('DELETE');
    expect(arg.newData).toBeUndefined();
  });

  it('falha no log NÃO derruba a request principal', async () => {
    setEntity('User');
    auditLogs.create.mockRejectedValue(new Error('banco caiu'));
    const req = { method: 'POST', user: { userId: 'admin' }, params: {} };
    const result = await lastValueFrom(
      await interceptor.intercept(makeContext(req), handler({ id: 'u1' })),
    );
    await flush();
    expect(result).toEqual({ id: 'u1' });
    expect(interceptor['logger'].error).toHaveBeenCalled();
  });

  it('falha ao buscar o registro anterior não impede a request', async () => {
    setEntity('User');
    prisma.user.findUnique.mockRejectedValue(new Error('x'));
    const req = {
      method: 'PATCH',
      user: { userId: 'admin' },
      params: { id: 'u1' },
    };
    const result = await lastValueFrom(
      await interceptor.intercept(makeContext(req), handler({ id: 'u1' })),
    );
    expect(result).toEqual({ id: 'u1' });
  });
});
