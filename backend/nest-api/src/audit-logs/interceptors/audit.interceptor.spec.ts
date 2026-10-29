import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError, lastValueFrom } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import {
  AUDITABLE_KEY,
  AuditableOptions,
} from '../decorators/auditable.decorator';

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
    jest.resetAllMocks();
    reflector = new Reflector();
    auditLogs = { create: jest.fn().mockResolvedValue(undefined) };
    prisma = {
      user: { findUnique: jest.fn() },
      role: { findUnique: jest.fn() },
    };
    interceptor = new AuditInterceptor(reflector, auditLogs as any, prisma);
    jest.spyOn(interceptor['logger'], 'error').mockImplementation();
    jest.spyOn(interceptor['logger'], 'warn').mockImplementation();
  });

  // Responde por chave: nome da entidade e opções do @Auditable.
  const setMeta = (name: string | undefined, options: AuditableOptions = {}) =>
    jest
      .spyOn(reflector, 'get')
      .mockImplementation((key: any) =>
        key === AUDITABLE_KEY ? name : options,
      );
  const setEntity = (name: string | undefined) => setMeta(name);
  const handler = (value: any): CallHandler => ({ handle: () => of(value) });
  const run = async (req: any, value: any) => {
    const result = await lastValueFrom(
      await interceptor.intercept(makeContext(req), handler(value)),
    );
    await flush();
    return result;
  };

  it('ignora rota sem @Auditable', async () => {
    setEntity(undefined);
    await run({ method: 'POST', user: { userId: 'u' } }, { id: 1 });
    expect(auditLogs.create).not.toHaveBeenCalled();
  });

  it('não loga sem usuário autenticado (rota pública)', async () => {
    setEntity('User');
    await run({ method: 'POST', params: {} }, { id: 'x' });
    expect(auditLogs.create).not.toHaveBeenCalled();
  });

  it('CREATE: grava dados novos sem passwordHash', async () => {
    setEntity('User');
    await run(
      { method: 'POST', user: { userId: 'admin' }, params: {} },
      { id: 'u1', name: 'A', passwordHash: 'SEGREDO', role: { name: 'X' } },
    );
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
    await run(
      { method: 'PATCH', user: { userId: 'admin' }, params: { id: 'u1' } },
      { id: 'u1', name: 'Novo' },
    );
    const arg = auditLogs.create.mock.calls[0][0];
    expect(arg.action).toBe('UPDATE');
    expect(arg.previousData).toEqual({ id: 'u1', name: 'Antigo' });
    expect(arg.newData).toEqual({ id: 'u1', name: 'Novo' });
  });

  it('converte id numérico da URL para number ao buscar o registro anterior (models Int)', async () => {
    setEntity('Role');
    prisma.role.findUnique.mockResolvedValue({ id: 5 });
    await run(
      { method: 'PATCH', user: { userId: 'admin' }, params: { id: '5' } },
      { id: 5 },
    );
    expect(prisma.role.findUnique).toHaveBeenCalledWith({ where: { id: 5 } });
  });

  it('DELETE: sem dados novos', async () => {
    setEntity('User');
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', name: 'X' });
    await run(
      { method: 'DELETE', user: { userId: 'admin' }, params: { id: 'u1' } },
      { id: 'u1' },
    );
    const arg = auditLogs.create.mock.calls[0][0];
    expect(arg.action).toBe('DELETE');
    expect(arg.newData).toBeUndefined();
  });

  it('DELETE com handler void: usa o id da URL', async () => {
    setEntity('User');
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    await run(
      { method: 'DELETE', user: { userId: 'admin' }, params: { id: 'u1' } },
      undefined,
    );
    expect(auditLogs.create.mock.calls[0][0].entityId).toBe('u1');
  });

  it('falha no log NÃO derruba a request principal', async () => {
    setEntity('User');
    auditLogs.create.mockRejectedValue(new Error('banco caiu'));
    const result = await run(
      { method: 'POST', user: { userId: 'admin' }, params: {} },
      { id: 'u1' },
    );
    expect(result).toEqual({ id: 'u1' });
    expect(interceptor['logger'].error).toHaveBeenCalled();
  });

  it('log lento NÃO atrasa a resposta (fire-and-forget)', async () => {
    setEntity('User');
    auditLogs.create.mockReturnValue(new Promise(() => {})); // nunca resolve
    const result = await lastValueFrom(
      await interceptor.intercept(
        makeContext({ method: 'POST', user: { userId: 'admin' }, params: {} }),
        handler({ id: 'u1' }),
      ),
    );
    expect(result).toEqual({ id: 'u1' });
  });

  it('falha ao buscar o registro anterior não impede a request', async () => {
    setEntity('User');
    prisma.user.findUnique.mockRejectedValue(new Error('x'));
    const result = await run(
      { method: 'PATCH', user: { userId: 'admin' }, params: { id: 'u1' } },
      { id: 'u1' },
    );
    expect(result).toEqual({ id: 'u1' });
  });

  it('handler que lança exceção não gera log', async () => {
    setEntity('User');
    const failing: CallHandler = {
      handle: () => throwError(() => new Error('400')),
    };
    await expect(
      lastValueFrom(
        await interceptor.intercept(
          makeContext({ method: 'POST', user: { userId: 'admin' }, params: {} }),
          failing,
        ),
      ),
    ).rejects.toThrow('400');
    await flush();
    expect(auditLogs.create).not.toHaveBeenCalled();
  });

  // ---- Débito 1: sub-rotas sem :id / retorno array ----
  it('reorder: entityId fixo + retorno array, sem buscar registro anterior', async () => {
    setMeta('Sacrament', { action: 'UPDATE', entityId: 'reorder' });
    const sacraments = [{ id: 2 }, { id: 1 }];
    await run(
      { method: 'PATCH', user: { userId: 'admin' }, params: {} },
      sacraments,
    );
    const arg = auditLogs.create.mock.calls[0][0];
    expect(arg).toMatchObject({
      action: 'UPDATE',
      entity: 'Sacrament',
      entityId: 'reorder',
      newData: sacraments,
    });
    expect(arg.previousData).toBeUndefined();
  });

  it('entityId como função recebe params/body/response', async () => {
    const resolver = jest.fn().mockReturnValue(42);
    setMeta('Mass', { action: 'UPDATE', entityId: resolver });
    await run(
      {
        method: 'POST',
        user: { userId: 'admin' },
        params: { id: '9' },
        body: { a: 1 },
      },
      [{ x: 1 }],
    );
    expect(resolver).toHaveBeenCalledWith({
      params: { id: '9' },
      body: { a: 1 },
      response: [{ x: 1 }],
    });
    expect(auditLogs.create.mock.calls[0][0].entityId).toBe('42');
  });

  it('sem entityId resolvível (sem id, sem fallback): não loga', async () => {
    setEntity('Sacrament');
    await run({ method: 'PATCH', user: { userId: 'admin' }, params: {} }, [{ id: 1 }]);
    expect(auditLogs.create).not.toHaveBeenCalled();
  });

  it('trunca entityId em 36 caracteres (VarChar(36))', async () => {
    setMeta('Sacrament', { entityId: 'x'.repeat(50) });
    await run({ method: 'POST', user: { userId: 'admin' }, params: {} }, { id: 1 });
    expect(auditLogs.create.mock.calls[0][0].entityId).toHaveLength(36);
  });

  // ---- Model inexistente ----
  it('@Auditable com model inexistente: avisa (warn), segue a request e ainda loga', async () => {
    setEntity('Inexistente');
    const result = await run(
      { method: 'PATCH', user: { userId: 'admin' }, params: { id: '1' } },
      { id: 1 },
    );
    expect(result).toEqual({ id: 1 });
    expect(interceptor['logger'].warn).toHaveBeenCalled();
    const arg = auditLogs.create.mock.calls[0][0];
    expect(arg.previousData).toBeUndefined();
    expect(arg.newData).toEqual({ id: 1 });
  });

  // ---- Sanitize ----
  it('sanitize: remove segredos em objetos aninhados, arrays e chaves em outro case', async () => {
    setEntity('User');
    await run(
      { method: 'POST', user: { userId: 'admin' }, params: {} },
      {
        id: 'u1',
        PasswordHash: 'S1',
        profile: { password: 'S2', deep: { newPassword: 'S3' } },
        list: [{ senha_hash: 'S4' }, { accessToken: 'S5' }],
      },
    );
    const json = JSON.stringify(auditLogs.create.mock.calls[0][0]);
    for (const s of ['S1', 'S2', 'S3', 'S4', 'S5']) {
      expect(json).not.toContain(s);
    }
  });

  it('rota de troca de senha: nada de hash/senha em dados anteriores nem novos', async () => {
    setMeta('User', { action: 'UPDATE' });
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      name: 'A',
      passwordHash: 'HASH_ANTIGO',
    });
    await run(
      { method: 'PATCH', user: { userId: 'admin' }, params: { id: 'u1' } },
      { id: 'u1', name: 'A', passwordHash: 'HASH_NOVO' },
    );
    const json = JSON.stringify(auditLogs.create.mock.calls[0][0]);
    expect(json).not.toContain('HASH_ANTIGO');
    expect(json).not.toContain('HASH_NOVO');
  });

  // ---- LGPD ----
  it('LGPD: mascara telefone/e-mail/contato/IP e mantém id e nome', async () => {
    setEntity('Volunteer');
    await run(
      { method: 'POST', user: { userId: 'admin' }, params: {} },
      {
        id: 7,
        name: 'Maria',
        phone: '47999990000',
        email: 'maria@x.com',
        contact: 'zap',
        ipAddress: '1.2.3.4',
      },
    );
    const arg = auditLogs.create.mock.calls[0][0];
    expect(arg.newData).toEqual({
      id: 7,
      name: 'Maria',
      phone: '[REDACTED]',
      email: '[REDACTED]',
      contact: '[REDACTED]',
      ipAddress: '[REDACTED]',
    });
    expect(JSON.stringify(arg)).not.toContain('47999990000');
  });

  it('preserva Date (não vira objeto vazio)', async () => {
    setEntity('Mass');
    const when = new Date('2026-12-25T19:00:00.000Z');
    await run(
      { method: 'POST', user: { userId: 'admin' }, params: {} },
      { id: 1, dateTime: when },
    );
    expect(auditLogs.create.mock.calls[0][0].newData.dateTime).toBe(when);
  });
});