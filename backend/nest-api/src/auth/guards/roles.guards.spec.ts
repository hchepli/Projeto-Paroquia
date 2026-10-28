import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guards';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  const ctx = (user?: any) =>
    ({
      getHandler: () => null,
      getClass: () => null,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  // O guard lê DUAS metadatas (IS_PUBLIC_KEY e ROLES_KEY): o mock precisa responder por chave.
  const mockMeta = ({
    isPublic = false,
    roles,
  }: {
    isPublic?: boolean;
    roles?: string[];
  }) =>
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === IS_PUBLIC_KEY ? isPublic : key === ROLES_KEY ? roles : undefined,
    );

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('libera quando a rota não exige cargo', () => {
    mockMeta({ roles: undefined });
    expect(guard.canActivate(ctx({ roleName: 'Secretaria' }))).toBe(true);
  });

  it('libera quando a lista de cargos é vazia', () => {
    mockMeta({ roles: [] });
    expect(guard.canActivate(ctx({ roleName: 'Secretaria' }))).toBe(true);
  });

  it('libera quando o cargo do usuário está na lista', () => {
    mockMeta({ roles: ['Admin Geral'] });
    expect(guard.canActivate(ctx({ roleName: 'Admin Geral' }))).toBe(true);
  });

  it('lança 403 quando o cargo não está na lista', () => {
    mockMeta({ roles: ['Admin Geral'] });
    expect(() => guard.canActivate(ctx({ roleName: 'Secretaria' }))).toThrow(
      ForbiddenException,
    );
  });

  it('lança 403 quando não há usuário na requisição', () => {
    mockMeta({ roles: ['Admin Geral'] });
    expect(() => guard.canActivate(ctx(undefined))).toThrow(ForbiddenException);
  });

  it('rota @Public libera mesmo sem usuário e sem checar o cargo', () => {
    mockMeta({ isPublic: true, roles: ['Admin Geral'] });
    expect(guard.canActivate(ctx(undefined))).toBe(true);
  });
});
