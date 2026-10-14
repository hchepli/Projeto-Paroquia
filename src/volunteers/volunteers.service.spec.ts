// src/volunteers/volunteers.service.spec.ts
import { Test } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { VolunteersService } from './volunteers.service';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_NAMES } from '../common/constrants/role-names.constants';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

const makeUser = (o: Partial<AuthUser> = {}): AuthUser => ({
  userId: 'u1', email: 'a@x.com', roleId: 1, roleName: ROLE_NAMES.ADMIN, pastoralGroupId: null, ...o,
});
const ADMIN = makeUser();
const COORD = makeUser({ roleName: ROLE_NAMES.COORDENADOR, pastoralGroupId: 2 });
const COORD_SEM_PASTORAL = makeUser({ roleName: ROLE_NAMES.COORDENADOR, pastoralGroupId: null });

const vol = (o: Record<string, unknown> = {}) => ({
  id: 10, name: 'Maria', phone: '11999990002', email: null, pastoralGroupId: 2, ...o,
});
const DAY = 86_400_000;
const assignmentRow = (date: Date) => ({
  role: 'leitor',
  schedule: { id: 's1', mass: { title: 'Missa', dateTime: date }, event: null },
});
const FUTURE = new Date(Date.now() + 30 * DAY);
const PAST = new Date(Date.now() - 30 * DAY);

describe('VolunteersService', () => {
  let service: VolunteersService;

  const prismaMock: any = {
    volunteer: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    pastoralGroup: { findUnique: jest.fn() },
    scheduleAssignment: { findMany: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    prismaMock.$transaction.mockImplementation((cb: any) => cb(prismaMock));
    const module = await Test.createTestingModule({
      providers: [VolunteersService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(VolunteersService);
  });

  describe('create (UC008 / RN006)', () => {
    const dto = { name: 'N', phone: '11999990000', pastoralGroupId: 2 };

    it('403 se Coordenador cadastra para outra pastoral (e não toca no banco)', async () => {
      await expect(service.create({ ...dto, pastoralGroupId: 3 }, COORD)).rejects.toThrow(ForbiddenException);
      expect(prismaMock.volunteer.create).not.toHaveBeenCalled();
    });

    it('403 se Coordenador não tem pastoral', async () => {
      await expect(service.create(dto, COORD_SEM_PASTORAL)).rejects.toThrow(ForbiddenException);
    });

    it('Coordenador cadastra na própria pastoral', async () => {
      prismaMock.pastoralGroup.findUnique.mockResolvedValue({ id: 2 });
      prismaMock.volunteer.create.mockResolvedValue(vol());
      await service.create(dto, COORD);
      expect(prismaMock.volunteer.create.mock.calls[0][0].data.pastoralGroup).toEqual({ connect: { id: 2 } });
    });

    it('404 se a pastoral não existe', async () => {
      prismaMock.pastoralGroup.findUnique.mockResolvedValue(null);
      await expect(service.create({ ...dto, pastoralGroupId: 99 }, ADMIN)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll (UC010 / RN006)', () => {
    it('Coordenador: força a própria pastoral e ignora o filtro da query', async () => {
      prismaMock.volunteer.findMany.mockResolvedValue([]);
      await service.findAll(COORD, { pastoralGroupId: 3 });
      expect(prismaMock.volunteer.findMany.mock.calls[0][0].where).toEqual({ pastoralGroupId: 2 });
    });

    it('Coordenador sem pastoral recebe lista vazia', async () => {
      await expect(service.findAll(COORD_SEM_PASTORAL, {})).resolves.toEqual([]);
      expect(prismaMock.volunteer.findMany).not.toHaveBeenCalled();
    });

    it('Admin: filtra só se pedir', async () => {
      prismaMock.volunteer.findMany.mockResolvedValue([]);
      await service.findAll(ADMIN, { pastoralGroupId: 3 });
      expect(prismaMock.volunteer.findMany.mock.calls[0][0].where).toEqual({ pastoralGroupId: 3 });
      await service.findAll(ADMIN, {});
      expect(prismaMock.volunteer.findMany.mock.calls[1][0].where).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('404 se não existe', async () => {
      prismaMock.volunteer.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1, ADMIN)).rejects.toThrow(NotFoundException);
    });

    it('403 se Coordenador lê voluntário de outra pastoral', async () => {
      prismaMock.volunteer.findUnique.mockResolvedValue(vol({ pastoralGroupId: 3 }));
      await expect(service.findOne(10, COORD)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update (RN006 / UC009)', () => {
    it('403 se Coordenador edita voluntário de outra pastoral', async () => {
      prismaMock.volunteer.findUnique.mockResolvedValue(vol({ pastoralGroupId: 3 }));
      await expect(service.update(10, { name: 'x' }, COORD)).rejects.toThrow(ForbiddenException);
      expect(prismaMock.volunteer.update).not.toHaveBeenCalled();
    });

    it('403 se Coordenador tenta mover para outra pastoral', async () => {
      prismaMock.volunteer.findUnique.mockResolvedValue(vol());
      await expect(service.update(10, { pastoralGroupId: 3 }, COORD)).rejects.toThrow(ForbiddenException);
    });

    it('edição sem mudar de pastoral não consulta atribuições', async () => {
      prismaMock.volunteer.findUnique.mockResolvedValue(vol());
      prismaMock.volunteer.update.mockResolvedValue(vol());
      await service.update(10, { name: 'Novo', pastoralGroupId: 2 }, COORD);
      expect(prismaMock.scheduleAssignment.findMany).not.toHaveBeenCalled();
      expect(prismaMock.volunteer.update.mock.calls[0][0].data.pastoralGroup).toBeUndefined();
    });

    it('409 ao mover Admin com atribuição em escala futura', async () => {
      prismaMock.volunteer.findUnique.mockResolvedValue(vol());
      prismaMock.pastoralGroup.findUnique.mockResolvedValue({ id: 3 });
      prismaMock.scheduleAssignment.findMany.mockResolvedValue([assignmentRow(FUTURE)]);
      await expect(service.update(10, { pastoralGroupId: 3 }, ADMIN)).rejects.toThrow(ConflictException);
      expect(prismaMock.volunteer.update).not.toHaveBeenCalled();
    });

    it('permite mover quando só há atribuições passadas', async () => {
      prismaMock.volunteer.findUnique.mockResolvedValue(vol());
      prismaMock.pastoralGroup.findUnique.mockResolvedValue({ id: 3 });
      prismaMock.scheduleAssignment.findMany.mockResolvedValue([assignmentRow(PAST)]);
      prismaMock.volunteer.update.mockResolvedValue(vol({ pastoralGroupId: 3 }));
      await service.update(10, { pastoralGroupId: 3 }, ADMIN);
      expect(prismaMock.volunteer.update.mock.calls[0][0].data.pastoralGroup).toEqual({ connect: { id: 3 } });
    });

    it('404 ao mover para pastoral inexistente', async () => {
      prismaMock.volunteer.findUnique.mockResolvedValue(vol());
      prismaMock.pastoralGroup.findUnique.mockResolvedValue(null);
      await expect(service.update(10, { pastoralGroupId: 99 }, ADMIN)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove (UC009)', () => {
    it('403 se Coordenador remove voluntário de outra pastoral', async () => {
      prismaMock.volunteer.findUnique.mockResolvedValue(vol({ pastoralGroupId: 3 }));
      await expect(service.remove(10, false, COORD)).rejects.toThrow(ForbiddenException);
    });

    it('sem atribuições: remove direto', async () => {
      prismaMock.volunteer.findUnique.mockResolvedValue(vol());
      prismaMock.scheduleAssignment.findMany.mockResolvedValue([]);
      prismaMock.volunteer.delete.mockResolvedValue(vol());
      await service.remove(10, false, ADMIN);
      expect(prismaMock.volunteer.delete).toHaveBeenCalledWith({ where: { id: 10 } });
    });

    it('com atribuições e sem confirmação: 409 pedindo confirmação, sem apagar nada', async () => {
      prismaMock.volunteer.findUnique.mockResolvedValue(vol());
      prismaMock.scheduleAssignment.findMany.mockResolvedValue([assignmentRow(FUTURE)]);
      const err: any = await service.remove(10, false, ADMIN).catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.getResponse()).toMatchObject({ requiresConfirmation: true });
      expect(err.getResponse().assignments).toHaveLength(1);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('com confirmação: apaga atribuições e voluntário na mesma transação, nessa ordem', async () => {
      prismaMock.volunteer.findUnique.mockResolvedValue(vol());
      prismaMock.scheduleAssignment.findMany.mockResolvedValue([assignmentRow(FUTURE)]);
      prismaMock.scheduleAssignment.deleteMany.mockResolvedValue({ count: 1 });
      prismaMock.volunteer.delete.mockResolvedValue(vol());
      await service.remove(10, true, ADMIN);
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      const order = [
        prismaMock.scheduleAssignment.deleteMany.mock.invocationCallOrder[0],
        prismaMock.volunteer.delete.mock.invocationCallOrder[0],
      ];
      expect(order[0]).toBeLessThan(order[1]);
    });
  });
});