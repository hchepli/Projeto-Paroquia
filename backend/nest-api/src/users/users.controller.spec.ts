// src/users/users.controller.spec.ts
import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { AUDITABLE_KEY } from '../audit-logs/decorators/auditable.decorator';
import { ROLE_NAMES } from '../common/constrants/role-names.constants';

describe('UsersController', () => {
  let controller: UsersController;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    changePassword: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();
    controller = module.get(UsersController);
  });

  it('protege o controller INTEIRO para Admin Geral (@Roles na classe, RN004)', () => {
    expect(Reflect.getMetadata(ROLES_KEY, UsersController)).toEqual([
      ROLE_NAMES.ADMIN,
    ]);
  });

  it.each(['create', 'update', 'changePassword', 'remove'] as const)(
    '%s é auditado como User',
    (method) => {
      expect(
        Reflect.getMetadata(AUDITABLE_KEY, UsersController.prototype[method]),
      ).toBe('User');
    },
  );

  it.each(['findAll', 'findOne'] as const)(
    '%s (leitura) não é auditado',
    (method) => {
      expect(
        Reflect.getMetadata(AUDITABLE_KEY, UsersController.prototype[method]),
      ).toBeUndefined();
    },
  );

  it('remove repassa o id do ator logado (trava de auto-exclusão)', async () => {
    await controller.remove('alvo', { userId: 'ator' } as any);
    expect(service.remove).toHaveBeenCalledWith('alvo', 'ator');
  });

  it('changePassword repassa só a nova senha', async () => {
    await controller.changePassword('u1', { newPassword: 'nova12345' });
    expect(service.changePassword).toHaveBeenCalledWith('u1', 'nova12345');
  });

  it('findAll repassa os filtros', async () => {
    await controller.findAll({ roleId: 2 });
    expect(service.findAll).toHaveBeenCalledWith({ roleId: 2 });
  });
});
