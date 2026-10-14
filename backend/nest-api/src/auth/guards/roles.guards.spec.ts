import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guards';

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  const ctx = (user?: any) =>
    ({
      getHandler: () => null,
      getClass: () => null,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('libera quando a rota não exige cargo', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(ctx({ roleName: 'Secretaria' }))).toBe(true);
  });

  it('libera quando o cargo do usuário está na lista', () => {
    reflector.getAllAndOverride.mockReturnValue(['Admin Geral']);
    expect(guard.canActivate(ctx({ roleName: 'Admin Geral' }))).toBe(true);
  });

  it('lança 403 quando o cargo não está na lista', () => {
    reflector.getAllAndOverride.mockReturnValue(['Admin Geral']);
    expect(() => guard.canActivate(ctx({ roleName: 'Secretaria' }))).toThrow(
      ForbiddenException,
    );
  });

  it('lança 403 quando não há usuário na requisição', () => {
    reflector.getAllAndOverride.mockReturnValue(['Admin Geral']);
    expect(() => guard.canActivate(ctx(undefined))).toThrow(ForbiddenException);
  });
});