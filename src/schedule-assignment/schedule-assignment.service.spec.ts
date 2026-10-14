// src/schedule-assignment/schedule-assignment.service.spec.ts
import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ScheduleAssignmentService } from './schedule-assignment.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { ROLE_NAMES } from '../common/constrants/role-names.constants';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

const makeUser = (o: Partial<AuthUser> = {}): AuthUser => ({
  userId: 'u1', email: 'a@x.com', roleId: 1, roleName: ROLE_NAMES.ADMIN, pastoralGroupId: null, ...o,
});
const ADMIN = makeUser();
const COORD = makeUser({ roleName: ROLE_NAMES.COORDENADOR, pastoralGroupId: 2 });
const COORD_SEM_PASTORAL = makeUser({ roleName: ROLE_NAMES.COORDENADOR, pastoralGroupId: null });
const prismaError = (code: string) => new Prisma.PrismaClientKnownRequestError('x', { code, clientVersion: 't' });

const schedule = (pastoralGroupId: number | null) => ({ id: 's1', pastoralGroupId });
const dto = { scheduleId: 's1', volunteerId: 10, role: 'leitor' };
const existing = (pg: number | null) => ({ id: 1, scheduleId: 's1', volunteerId: 10, role: 'leitor', schedule: { pastoralGroupId: pg } });

describe('ScheduleAssignmentService', () => {
  let service: ScheduleAssignmentService;

  const prismaMock: any = {
    schedule: { findUnique: jest.fn() },
    volunteer: { findUnique: jest.fn() },
    scheduleAssignment: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [ScheduleAssignmentService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(ScheduleAssignmentService);
  });

  describe('create', () => {
    it('404 se a escala não existe', async () => {
      prismaMock.schedule.findUnique.mockResolvedValue(null);
      await expect(service.create(dto, ADMIN)).rejects.toThrow(NotFoundException);
    });

    it('403 se Coordenador usa escala de outra pastoral', async () => {
      prismaMock.schedule.findUnique.mockResolvedValue(schedule(3));
      await expect(service.create(dto, COORD)).rejects.toThrow(ForbiddenException);
      expect(prismaMock.scheduleAssignment.create).not.toHaveBeenCalled();
    });

    it('403 se Coordenador sem pastoral e escala sem pastoral (null !== acesso)', async () => {
      prismaMock.schedule.findUnique.mockResolvedValue(schedule(null));
      await expect(service.create(dto, COORD_SEM_PASTORAL)).rejects.toThrow(ForbiddenException);
    });

    it('404 se o voluntário não existe', async () => {
      prismaMock.schedule.findUnique.mockResolvedValue(schedule(2));
      prismaMock.volunteer.findUnique.mockResolvedValue(null);
      await expect(service.create(dto, ADMIN)).rejects.toThrow(NotFoundException);
    });

    it('400 se o voluntário é de outra pastoral (vale para Admin também)', async () => {
      prismaMock.schedule.findUnique.mockResolvedValue(schedule(2));
      prismaMock.volunteer.findUnique.mockResolvedValue({ id: 10, pastoralGroupId: 3 });
      await expect(service.create(dto, ADMIN)).rejects.toThrow(BadRequestException);
    });

    it('cria quando voluntário e escala são da mesma pastoral', async () => {
      prismaMock.schedule.findUnique.mockResolvedValue(schedule(2));
      prismaMock.volunteer.findUnique.mockResolvedValue({ id: 10, pastoralGroupId: 2 });
      prismaMock.scheduleAssignment.create.mockResolvedValue({ id: 1 });
      await service.create(dto, COORD);
      expect(prismaMock.scheduleAssignment.create).toHaveBeenCalledWith({ data: dto });
    });

    it('escala legada sem pastoral não restringe voluntário', async () => {
      prismaMock.schedule.findUnique.mockResolvedValue(schedule(null));
      prismaMock.volunteer.findUnique.mockResolvedValue({ id: 10, pastoralGroupId: 3 });
      prismaMock.scheduleAssignment.create.mockResolvedValue({ id: 1 });
      await expect(service.create(dto, ADMIN)).resolves.toBeDefined();
    });

    it('409 amigável em duplicidade (P2002)', async () => {
      prismaMock.schedule.findUnique.mockResolvedValue(schedule(2));
      prismaMock.volunteer.findUnique.mockResolvedValue({ id: 10, pastoralGroupId: 2 });
      prismaMock.scheduleAssignment.create.mockRejectedValue(prismaError('P2002'));
      await expect(service.create(dto, ADMIN)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('403 se Coordenador edita atribuição de outra pastoral', async () => {
      prismaMock.scheduleAssignment.findUnique.mockResolvedValue(existing(3));
      await expect(service.update(1, { role: 'x' }, COORD)).rejects.toThrow(ForbiddenException);
    });

    it('400 ao trocar para voluntário de outra pastoral', async () => {
      prismaMock.scheduleAssignment.findUnique.mockResolvedValue(existing(2));
      prismaMock.volunteer.findUnique.mockResolvedValue({ id: 11, pastoralGroupId: 3 });
      await expect(service.update(1, { volunteerId: 11 }, ADMIN)).rejects.toThrow(BadRequestException);
    });

    it('403 se Coordenador move a atribuição para escala fora do escopo', async () => {
      prismaMock.scheduleAssignment.findUnique.mockResolvedValue(existing(2));
      prismaMock.schedule.findUnique.mockResolvedValue(schedule(3));
      await expect(service.update(1, { scheduleId: 's2' }, COORD)).rejects.toThrow(ForbiddenException);
    });

    it('alterar só a função não revalida voluntário', async () => {
      prismaMock.scheduleAssignment.findUnique.mockResolvedValue(existing(2));
      prismaMock.scheduleAssignment.update.mockResolvedValue({ id: 1 });
      await service.update(1, { role: 'coroinha' }, ADMIN);
      expect(prismaMock.volunteer.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('findAll / remove', () => {
    it('Coordenador só lista atribuições de escalas da própria pastoral', async () => {
      prismaMock.scheduleAssignment.findMany.mockResolvedValue([]);
      await service.findAll(COORD);
      expect(prismaMock.scheduleAssignment.findMany.mock.calls[0][0].where).toEqual({ schedule: { pastoralGroupId: 2 } });
    });

    it('403 ao remover atribuição de outra pastoral', async () => {
      prismaMock.scheduleAssignment.findUnique.mockResolvedValue(existing(3));
      await expect(service.remove(1, COORD)).rejects.toThrow(ForbiddenException);
      expect(prismaMock.scheduleAssignment.delete).not.toHaveBeenCalled();
    });
  });
});