// src/roles/roles.service.spec.ts
import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('x', { code, clientVersion: 't' });

const makeRole = (o: Record<string, unknown> = {}) => ({
  id: 1, name: 'Secretaria', isBase: false, _count: { users: 0 }, ...o,
});

describe('RolesService', () => {
  let service: RolesService;
  const prismaMock: any = {
    role: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [RolesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(RolesService);
  });

  it('cria cargo', async () => {
    prismaMock.role.create.mockResolvedValue(makeRole());
    await service.create({ name: 'Secretaria' });
    expect(prismaMock.role.create.mock.calls[0][0].data).toEqual({ name: 'Secretaria' });
  });

  it('409 se o nome já existe (P2002)', async () => {
    prismaMock.role.create.mockRejectedValue(prismaError('P2002'));
    await expect(service.create({ name: 'Secretaria' })).rejects.toThrow(ConflictException);
  });

  it('404 se não existe', async () => {
    prismaMock.role.findUnique.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  describe('update', () => {
    it('409 ao renomear cargo base', async () => {
      prismaMock.role.findUnique.mockResolvedValue(makeRole({ isBase: true, name: 'Admin Geral' }));
      await expect(service.update(1, { name: 'Outro' })).rejects.toThrow(ConflictException);
      expect(prismaMock.role.update).not.toHaveBeenCalled();
    });

    it('permite editar a descrição de cargo base', async () => {
      prismaMock.role.findUnique.mockResolvedValue(makeRole({ isBase: true }));
      prismaMock.role.update.mockResolvedValue(makeRole());
      await service.update(1, { description: 'nova' });
      expect(prismaMock.role.update).toHaveBeenCalled();
    });

    it('permite renomear cargo não-base', async () => {
      prismaMock.role.findUnique.mockResolvedValue(makeRole());
      prismaMock.role.update.mockResolvedValue(makeRole({ name: 'Novo' }));
      await service.update(1, { name: 'Novo' });
      expect(prismaMock.role.update).toHaveBeenCalled();
    });
  });

  describe('remove (UC006)', () => {
    it('409 se há usuários vinculados', async () => {
      prismaMock.role.findUnique.mockResolvedValue(makeRole({ _count: { users: 2 } }));
      await expect(service.remove(1)).rejects.toThrow(/2 usuário/);
      expect(prismaMock.role.delete).not.toHaveBeenCalled();
    });

    it('409 ao remover cargo base sem confirmação', async () => {
      prismaMock.role.findUnique.mockResolvedValue(makeRole({ isBase: true }));
      await expect(service.remove(1)).rejects.toThrow(ConflictException);
    });

    it('remove cargo base com confirmBase=true', async () => {
      prismaMock.role.findUnique.mockResolvedValue(makeRole({ isBase: true }));
      prismaMock.role.delete.mockResolvedValue(makeRole());
      await service.remove(1, true);
      expect(prismaMock.role.delete).toHaveBeenCalled();
    });

    it('409 se um usuário foi vinculado durante a remoção (P2003)', async () => {
      prismaMock.role.findUnique.mockResolvedValue(makeRole());
      prismaMock.role.delete.mockRejectedValue(prismaError('P2003'));
      await expect(service.remove(1)).rejects.toThrow(ConflictException);
    });
  });
});