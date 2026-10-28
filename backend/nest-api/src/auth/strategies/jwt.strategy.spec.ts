import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy.validate', () => {
  const config = { getOrThrow: () => 'x'.repeat(32) };
  let prisma: { user: { findUnique: jest.Mock } };
  let strategy: JwtStrategy;

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    strategy = new JwtStrategy(config as any, prisma as any);
  });

  const payload = { sub: 'u1', email: 'a@a.com' };

  it('rejeita usuário inexistente', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejeita usuário INACTIVE mesmo com token válido', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', status: 'INACTIVE' });
    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('devolve cargo e pastoral ATUAIS do banco, não do token', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@a.com',
      status: 'ACTIVE',
      roleId: 3,
      pastoralGroupId: 7,
      role: { name: 'Coordenador de Pastoral' },
    });

    expect(await strategy.validate(payload)).toEqual({
      userId: 'u1',
      email: 'a@a.com',
      roleId: 3,
      roleName: 'Coordenador de Pastoral',
      pastoralGroupId: 7,
    });
  });
});
