// src/users/users.service.spec.ts
import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

jest.mock('bcrypt', () => ({ hash: jest.fn() }));

const ADMIN = { id: 1, name: 'Admin Geral' };
const SEC = { id: 2, name: 'Secretaria' };
const COORD = { id: 3, name: 'Coordenador de Pastoral' };

const makeUser = (o: Record<string, unknown> = {}) => ({
  id: 'u1', name: 'Fulano', email: 'f@x.com',
  roleId: ADMIN.id, role: ADMIN, pastoralGroupId: null, status: 'ACTIVE', ...o,
});

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('x', { code, clientVersion: 't' });

describe('UsersService', () => {
  let service: UsersService;

  const prismaMock: any = {
    user: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    role: { findUnique: jest.fn() },
    pastoralGroup: { findUnique: jest.fn() },
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    prismaMock.$transaction.mockImplementation((cb: any) => cb(prismaMock));
    prismaMock.$executeRaw.mockResolvedValue(1);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');

    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(UsersService);
  });

  describe('create (UC001 / RN006)', () => {
    const dto = { name: 'N', email: 'n@x.com', password: 'senha1234', roleId: SEC.id };

    it('gera o hash, não envia a senha em texto e omite o hash na resposta', async () => {
      prismaMock.role.findUnique.mockResolvedValue(SEC);
      prismaMock.user.create.mockResolvedValue({ id: 'u1' });

      await service.create(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('senha1234', 10);
      const arg = prismaMock.user.create.mock.calls[0][0];
      expect(arg.data.passwordHash).toBe('hashed-pw');
      expect(arg.data).not.toHaveProperty('password');
      expect(arg.omit).toEqual({ passwordHash: true });
    });

    it('400 se o cargo não existe', async () => {
      prismaMock.role.findUnique.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('400 se Coordenador não tem pastoral', async () => {
      prismaMock.role.findUnique.mockResolvedValue(COORD);
      await expect(service.create({ ...dto, roleId: COORD.id })).rejects.toThrow(BadRequestException);
    });

    it('400 se a pastoral do Coordenador não existe', async () => {
      prismaMock.role.findUnique.mockResolvedValue(COORD);
      prismaMock.pastoralGroup.findUnique.mockResolvedValue(null);
      await expect(service.create({ ...dto, roleId: COORD.id, pastoralGroupId: 99 })).rejects.toThrow(BadRequestException);
    });

    it('400 se cargo diferente de Coordenador vem com pastoral', async () => {
      prismaMock.role.findUnique.mockResolvedValue(SEC);
      await expect(service.create({ ...dto, pastoralGroupId: 1 })).rejects.toThrow(BadRequestException);
    });

    it('409 se o e-mail já existe (P2002)', async () => {
      prismaMock.role.findUnique.mockResolvedValue(SEC);
      prismaMock.user.create.mockRejectedValue(prismaError('P2002'));
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll / findOne (UC004)', () => {
    it('aplica filtros de cargo e status', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      await service.findAll({ roleId: 2, status: 'ACTIVE' as any });
      expect(prismaMock.user.findMany.mock.calls[0][0].where).toEqual({ roleId: 2, status: 'ACTIVE' });
    });

    it('404 se não existe', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update (UC002 / UC003)', () => {
    it('404 se não existe', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.update('x', { name: 'a' })).rejects.toThrow(NotFoundException);
    });

    it('edição simples não abre transação nem lock', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser({ roleId: SEC.id, role: SEC }));
      prismaMock.user.update.mockResolvedValue({});
      await service.update('u1', { name: 'Novo' });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
    });

    it('409 ao inativar o último Admin Geral ativo', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser());
      prismaMock.user.count.mockResolvedValue(0);
      await expect(service.update('u1', { status: 'INACTIVE' as any })).rejects.toThrow(ConflictException);
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('permite inativar Admin quando existe outro ativo (e usa o lock)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser());
      prismaMock.user.count.mockResolvedValue(1);
      prismaMock.user.update.mockResolvedValue({});
      await service.update('u1', { status: 'INACTIVE' as any });
      expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.update).toHaveBeenCalled();
    });

    it('409 ao rebaixar o último Admin Geral (troca de cargo)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser());
      prismaMock.role.findUnique.mockResolvedValue(SEC);
      prismaMock.user.count.mockResolvedValue(0);
      await expect(service.update('u1', { roleId: SEC.id })).rejects.toThrow(ConflictException);
    });

    it('zera a pastoral ao sair de Coordenador', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser({ roleId: COORD.id, role: COORD, pastoralGroupId: 5 }));
      prismaMock.role.findUnique.mockResolvedValue(SEC);
      prismaMock.user.update.mockResolvedValue({});
      await service.update('u1', { roleId: SEC.id });
      expect(prismaMock.user.update.mock.calls[0][0].data.pastoralGroupId).toBeNull();
    });

    it('400 ao virar Coordenador sem informar pastoral', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser({ roleId: SEC.id, role: SEC }));
      prismaMock.role.findUnique.mockResolvedValue(COORD);
      await expect(service.update('u1', { roleId: COORD.id })).rejects.toThrow(BadRequestException);
    });
  });

  describe('changePassword', () => {
    it('404 se não existe', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.changePassword('x', 'nova12345')).rejects.toThrow(NotFoundException);
    });

    it('grava somente o novo hash', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser());
      prismaMock.user.update.mockResolvedValue({});
      await service.changePassword('u1', 'nova12345');
      expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { passwordHash: 'hashed-pw' } });
    });
  });

  describe('remove', () => {
    it('409 ao remover o próprio usuário', async () => {
      await expect(service.remove('u1', 'u1')).rejects.toThrow(ConflictException);
    });

    it('409 ao remover o último Admin Geral ativo', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser());
      prismaMock.user.count.mockResolvedValue(0);
      await expect(service.remove('u1', 'outro')).rejects.toThrow(ConflictException);
      expect(prismaMock.user.delete).not.toHaveBeenCalled();
    });

    it('409 amigável quando há registros vinculados (P2003)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser({ roleId: SEC.id, role: SEC }));
      prismaMock.user.delete.mockRejectedValue(prismaError('P2003'));
      await expect(service.remove('u1', 'outro')).rejects.toThrow(/Inative-o/);
    });

    it('remove usuário comum', async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser({ roleId: SEC.id, role: SEC }));
      prismaMock.user.delete.mockResolvedValue({ id: 'u1' });
      await expect(service.remove('u1', 'outro')).resolves.toEqual({ id: 'u1' });
    });
  });
});