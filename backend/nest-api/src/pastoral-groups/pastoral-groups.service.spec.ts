// src/pastoral-groups/pastoral-groups.service.spec.ts
import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PastoralGroupsService } from './pastoral-groups.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { ROLE_NAMES } from '../common/constrants/role-names.constants';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

const makeUser = (o: Partial<AuthUser> = {}): AuthUser => ({
  userId: 'u1',
  email: 'a@x.com',
  roleId: 1,
  roleName: ROLE_NAMES.ADMIN,
  pastoralGroupId: null,
  ...o,
});
const ADMIN = makeUser();
const COORD = makeUser({
  roleName: ROLE_NAMES.COORDENADOR,
  pastoralGroupId: 2,
});
const pastoral = (o: Record<string, unknown> = {}) => ({
  id: 2,
  name: 'Liturgia',
  description: null,
  contact: null,
  defaultRole: 'leitor',
  ...o,
});
const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('x', { code, clientVersion: 't' });

describe('PastoralGroupsService', () => {
  let service: PastoralGroupsService;

  const prismaMock: any = {
    pastoralGroup: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: { count: jest.fn() },
    volunteer: { count: jest.fn() },
    schedule: { count: jest.fn() },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PastoralGroupsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(PastoralGroupsService);
  });

  it('UC034: listagem pública não expõe defaultRole nem datas', async () => {
    prismaMock.pastoralGroup.findMany.mockResolvedValue([]);
    await service.findAllPublic();
    expect(prismaMock.pastoralGroup.findMany.mock.calls[0][0].select).toEqual({
      id: true,
      name: true,
      description: true,
      contact: true,
    });
  });

  it('create: 409 com nome duplicado', async () => {
    prismaMock.pastoralGroup.create.mockRejectedValue(prismaError('P2002'));
    await expect(service.create({ name: 'Liturgia' })).rejects.toThrow(
      ConflictException,
    );
  });

  describe('update (RN006 / UC033)', () => {
    it('404 se não existe', async () => {
      prismaMock.pastoralGroup.findUnique.mockResolvedValue(null);
      await expect(
        service.update(2, { description: 'x' }, ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('403 se Coordenador edita outra pastoral', async () => {
      prismaMock.pastoralGroup.findUnique.mockResolvedValue(
        pastoral({ id: 3 }),
      );
      await expect(
        service.update(3, { description: 'x' }, COORD),
      ).rejects.toThrow(ForbiddenException);
      expect(prismaMock.pastoralGroup.update).not.toHaveBeenCalled();
    });

    it('403 se Coordenador tenta renomear a própria pastoral', async () => {
      prismaMock.pastoralGroup.findUnique.mockResolvedValue(pastoral());
      await expect(
        service.update(2, { name: 'Outro nome' }, COORD),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Coordenador edita conteúdo e pode reenviar o mesmo nome', async () => {
      prismaMock.pastoralGroup.findUnique.mockResolvedValue(pastoral());
      prismaMock.pastoralGroup.update.mockResolvedValue(pastoral());
      await service.update(
        2,
        { name: 'Liturgia', description: 'Nova', defaultRole: 'leitor' },
        COORD,
      );
      expect(prismaMock.pastoralGroup.update).toHaveBeenCalled();
    });

    it('Admin renomeia; 409 se o nome já existe', async () => {
      prismaMock.pastoralGroup.findUnique.mockResolvedValue(pastoral());
      prismaMock.pastoralGroup.update.mockResolvedValueOnce(
        pastoral({ name: 'Novo' }),
      );
      await service.update(2, { name: 'Novo' }, ADMIN);
      prismaMock.pastoralGroup.update.mockRejectedValueOnce(
        prismaError('P2002'),
      );
      await expect(
        service.update(2, { name: 'Catequese' }, ADMIN),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove (UC033)', () => {
    it('404 se não existe', async () => {
      prismaMock.pastoralGroup.findUnique.mockResolvedValue(null);
      await expect(service.remove(2)).rejects.toThrow(NotFoundException);
    });

    it('409 com contagens se há usuários, voluntários ou escalas', async () => {
      prismaMock.pastoralGroup.findUnique.mockResolvedValue(pastoral());
      prismaMock.user.count.mockResolvedValue(1);
      prismaMock.volunteer.count.mockResolvedValue(3);
      prismaMock.schedule.count.mockResolvedValue(0);
      const err: any = await service.remove(2).catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.getResponse().blockers).toEqual({
        users: 1,
        volunteers: 3,
        schedules: 0,
      });
      expect(prismaMock.pastoralGroup.delete).not.toHaveBeenCalled();
    });

    it('remove pastoral sem vínculos', async () => {
      prismaMock.pastoralGroup.findUnique.mockResolvedValue(pastoral());
      prismaMock.user.count.mockResolvedValue(0);
      prismaMock.volunteer.count.mockResolvedValue(0);
      prismaMock.schedule.count.mockResolvedValue(0);
      prismaMock.pastoralGroup.delete.mockResolvedValue(pastoral());
      await service.remove(2);
      expect(prismaMock.pastoralGroup.delete).toHaveBeenCalledWith({
        where: { id: 2 },
      });
    });
  });
});
