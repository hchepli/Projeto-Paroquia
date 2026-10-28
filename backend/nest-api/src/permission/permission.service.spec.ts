// src/permission/permission.service.spec.ts
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('x', { code, clientVersion: 't' });

describe('PermissionService', () => {
  let service: PermissionService;
  const prismaMock: any = {
    permission: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    role: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PermissionService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(PermissionService);
  });

  describe('create', () => {
    const dto = { roleId: 1, resource: 'missas', canView: true };

    it('cria quando o cargo existe', async () => {
      prismaMock.role.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.permission.create.mockResolvedValue({ id: 1, ...dto });
      await expect(service.create(dto)).resolves.toMatchObject({ id: 1 });
      expect(prismaMock.permission.create).toHaveBeenCalledWith({ data: dto });
    });

    it('400 se o cargo não existe', async () => {
      prismaMock.role.findUnique.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(prismaMock.permission.create).not.toHaveBeenCalled();
    });

    it('409 se já existe permissão para (cargo, recurso)', async () => {
      prismaMock.role.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.permission.create.mockRejectedValue(prismaError('P2002'));
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('propaga erros desconhecidos', async () => {
      prismaMock.role.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.permission.create.mockRejectedValue(new Error('boom'));
      await expect(service.create(dto)).rejects.toThrow('boom');
    });
  });

  describe('findAll / findOne', () => {
    it('lista ordenado por cargo e recurso', async () => {
      prismaMock.permission.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(prismaMock.permission.findMany).toHaveBeenCalledWith({
        orderBy: [{ roleId: 'asc' }, { resource: 'asc' }],
      });
    });

    it('404 se não existe', async () => {
      prismaMock.permission.findUnique.mockResolvedValue(null);
      await expect(service.findOne(9)).rejects.toThrow(NotFoundException);
    });

    it('retorna quando existe', async () => {
      prismaMock.permission.findUnique.mockResolvedValue({ id: 1 });
      await expect(service.findOne(1)).resolves.toEqual({ id: 1 });
    });
  });

  describe('update', () => {
    it('404 se não existe', async () => {
      prismaMock.permission.findUnique.mockResolvedValue(null);
      await expect(service.update(9, { canEdit: true })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('400 se troca para um cargo inexistente', async () => {
      prismaMock.permission.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.role.findUnique.mockResolvedValue(null);
      await expect(service.update(1, { roleId: 99 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('não consulta o cargo quando roleId não é enviado', async () => {
      prismaMock.permission.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.permission.update.mockResolvedValue({ id: 1 });
      await service.update(1, { canEdit: true });
      expect(prismaMock.role.findUnique).not.toHaveBeenCalled();
    });

    it('409 se a mudança duplica (cargo, recurso)', async () => {
      prismaMock.permission.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.permission.update.mockRejectedValue(prismaError('P2002'));
      await expect(service.update(1, { resource: 'eventos' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('404 se não existe', async () => {
      prismaMock.permission.findUnique.mockResolvedValue(null);
      await expect(service.remove(9)).rejects.toThrow(NotFoundException);
      expect(prismaMock.permission.delete).not.toHaveBeenCalled();
    });

    it('remove quando existe', async () => {
      prismaMock.permission.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.permission.delete.mockResolvedValue({ id: 1 });
      await expect(service.remove(1)).resolves.toEqual({ id: 1 });
    });
  });
});
