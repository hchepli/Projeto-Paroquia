import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JWT_EXPIRES_IN_SECONDS } from './auth.constants';

// hash bcrypt de 'senha12345'
const HASH = '$2b$10$xiyRExRUoEsP0pyIPwK8GOXbZdQKoClalX18IV8DMJLBaQk8hQULW';

const baseUser = {
  id: '6d4c2f31-aace-4c7b-80de-4400f2241d8b',
  name: 'Teste Auth',
  email: 'auth@teste.com',
  passwordHash: HASH,
  roleId: 1,
  role: { id: 1, name: 'Secretaria' },
  pastoralGroupId: null,
  status: 'ACTIVE',
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    jwtService = { sign: jest.fn().mockReturnValue('token-assinado') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: { findByEmail: jest.fn() } },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get(AuthService);
    usersService = module.get(UsersService);
  });

  it('retorna o usuário (sem passwordHash) quando a senha está correta', async () => {
    jest.spyOn(usersService, 'findByEmail').mockResolvedValue(baseUser as any);

    const result = await authService.validateUser('auth@teste.com', 'senha12345');

    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty('passwordHash');
    expect(result?.email).toBe('auth@teste.com');
  });

  it('retorna null quando a senha está errada', async () => {
    jest.spyOn(usersService, 'findByEmail').mockResolvedValue(baseUser as any);
    expect(await authService.validateUser('auth@teste.com', 'senhaErrada')).toBeNull();
  });

  it('retorna null quando o email não existe', async () => {
    jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
    expect(await authService.validateUser('naoexiste@teste.com', 'qualquer')).toBeNull();
  });

  it('usuário INACTIVE com senha correta lança mensagem específica (UC007 3b)', async () => {
    jest
      .spyOn(usersService, 'findByEmail')
      .mockResolvedValue({ ...baseUser, status: 'INACTIVE' } as any);

    await expect(
      authService.validateUser('auth@teste.com', 'senha12345'),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      authService.validateUser('auth@teste.com', 'senha12345'),
    ).rejects.toThrow(/inativa/i);
  });

  it('usuário INACTIVE com senha errada NÃO revela que está inativo', async () => {
    jest
      .spyOn(usersService, 'findByEmail')
      .mockResolvedValue({ ...baseUser, status: 'INACTIVE' } as any);

    expect(await authService.validateUser('auth@teste.com', 'errada')).toBeNull();
  });

  it('login assina só sub/email e devolve expires_in', () => {
    const result = authService.login({ id: baseUser.id, email: baseUser.email });

    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: baseUser.id,
      email: baseUser.email,
    });
    expect(result).toEqual({
      access_token: 'token-assinado',
      expires_in: JWT_EXPIRES_IN_SECONDS,
    });
  });
});