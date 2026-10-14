// src/roles/roles.controller.spec.ts
import { Test } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PermissionController } from '../permission/permission.controller';
import { PermissionService } from '../permission/permission.service';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { ROLE_NAMES } from '../common/constrants/role-names.constants';

describe('RolesController', () => {
  let controller: RolesController;
  const service = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), update: jest.fn(), remove: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [{ provide: RolesService, useValue: service }],
    }).compile();
    controller = module.get(RolesController);
  });

  it('protege o controller inteiro para Admin Geral', () => {
    expect(Reflect.getMetadata(ROLES_KEY, RolesController)).toEqual([ROLE_NAMES.ADMIN]);
  });

  it('remove repassa confirmBase', async () => {
    await controller.remove(3, true);
    expect(service.remove).toHaveBeenCalledWith(3, true);
  });

  it('remove sem confirmação repassa false', async () => {
    await controller.remove(3, false);
    expect(service.remove).toHaveBeenCalledWith(3, false);
  });
});

describe('PermissionController', () => {
  it('protege o controller inteiro para Admin Geral', async () => {
    const module = await Test.createTestingModule({
      controllers: [PermissionController],
      providers: [{ provide: PermissionService, useValue: {} }],
    }).compile();
    expect(module.get(PermissionController)).toBeDefined();
    expect(Reflect.getMetadata(ROLES_KEY, PermissionController)).toEqual([ROLE_NAMES.ADMIN]);
  });

  it('a rota é /permissions (plural, RNF013)', () => {
    expect(Reflect.getMetadata('path', PermissionController)).toBe('permissions');
  });
});