// src/schedule-assignment/schedule-assignment.service.spec.ts
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ScheduleAssignmentService } from './schedule-assignment.service';
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
const COORD_SEM_PASTORAL = makeUser({
  roleName: ROLE_NAMES.COORDENADOR,
  pastoralGroupId: null,
});
const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('x', { code, clientVersion: 't' });

const FUTURE = new Date(Date.now() + 7 * 86_400_000);
const PAST = new Date(Date.now() - 7 * 86_400_000);
const dto = { scheduleId: 's1', volunteerId: 10, role: 'leitor' };

describe('ScheduleAssignmentService', () => {
  let service: ScheduleAssignmentService;

  const prisma: any = {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    schedule: { findUniqueOrThrow: jest.fn() },
    mass: { findUnique: jest.fn() },
    event: { findUnique: jest.fn() },
    volunteer: { findMany: jest.fn() },
    scheduleAssignment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  /** Escala s1 da pastoral `pg`, Missa 1 em `when`; voluntário 10 da pastoral 2. */
  function scheduleOf(pg: number, when: Date = FUTURE) {
    prisma.$queryRaw.mockResolvedValue([{ id: 's1' }]);
    prisma.schedule.findUniqueOrThrow.mockResolvedValue({
      id: 's1',
      massId: 1,
      eventId: null,
      pastoralGroupId: pg,
    });
    prisma.mass.findUnique.mockResolvedValue({
      id: 1,
      title: 'M',
      dateTime: when,
    });
    prisma.volunteer.findMany.mockResolvedValue([
      { id: 10, pastoralGroupId: 2 },
    ]);
    prisma.scheduleAssignment.findMany.mockResolvedValue([]);
  }

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
    const module = await Test.createTestingModule({
      providers: [
        ScheduleAssignmentService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(ScheduleAssignmentService);
  });

  describe('create', () => {
    it('404 se a escala não existe', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      await expect(service.create(dto, ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('403 se Coordenador usa escala de outra pastoral; 403 se não tem pastoral', async () => {
      scheduleOf(3);
      await expect(service.create(dto, COORD)).rejects.toThrow(
        ForbiddenException,
      );
      scheduleOf(2);
      await expect(service.create(dto, COORD_SEM_PASTORAL)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.scheduleAssignment.create).not.toHaveBeenCalled();
    });

    it('409 em Evento cancelado', async () => {
      scheduleOf(2);
      prisma.schedule.findUniqueOrThrow.mockResolvedValue({
        id: 's1',
        massId: null,
        eventId: 5,
        pastoralGroupId: 2,
      });
      prisma.event.findUnique.mockResolvedValue({
        id: 5,
        name: 'E',
        startDate: FUTURE,
        endDate: null,
        status: 'CANCELLED',
        massId: null,
      });
      await expect(service.create(dto, ADMIN)).rejects.toThrow(
        ConflictException,
      );
    });

    it('409 se Coordenador altera escala de Missa já realizada; Admin pode', async () => {
      scheduleOf(2, PAST);
      await expect(service.create(dto, COORD)).rejects.toThrow(
        ConflictException,
      );
      prisma.scheduleAssignment.create.mockResolvedValue({ id: 1 });
      await expect(service.create(dto, ADMIN)).resolves.toBeDefined();
    });

    it('400 se o voluntário é de outra pastoral (vale para Admin); 400 se não existe', async () => {
      scheduleOf(3);
      await expect(service.create(dto, ADMIN)).rejects.toThrow(
        BadRequestException,
      );
      scheduleOf(2);
      prisma.volunteer.findMany.mockResolvedValue([]);
      await expect(service.create(dto, ADMIN)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('normaliza a função e devolve warnings', async () => {
      scheduleOf(2);
      prisma.scheduleAssignment.create.mockResolvedValue({
        id: 1,
        volunteerId: 10,
      });
      const res: any = await service.create(
        { ...dto, role: ' Leitor ' },
        COORD,
      );
      expect(prisma.scheduleAssignment.create).toHaveBeenCalledWith({
        data: { scheduleId: 's1', volunteerId: 10, role: 'leitor' },
      });
      expect(res.warnings).toEqual([]);
    });

    it('409 amigável em duplicidade (P2002), inclusive em corrida', async () => {
      scheduleOf(2);
      prisma.scheduleAssignment.create.mockRejectedValue(prismaError('P2002'));
      await expect(service.create(dto, ADMIN)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    const pre = (pg = 2) => {
      scheduleOf(pg);
      prisma.scheduleAssignment.findUnique.mockResolvedValue({
        id: 1,
        scheduleId: 's1',
        volunteerId: 10,
        role: 'leitor',
      });
    };

    it('404 se a atribuição não existe', async () => {
      prisma.scheduleAssignment.findUnique.mockResolvedValue(null);
      await expect(service.update(1, { role: 'x' }, ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('403 se Coordenador edita atribuição de outra pastoral', async () => {
      pre(3);
      await expect(service.update(1, { role: 'x' }, COORD)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.scheduleAssignment.update).not.toHaveBeenCalled();
    });

    it('só a função: normaliza e NÃO revalida voluntário', async () => {
      pre();
      prisma.scheduleAssignment.update.mockResolvedValue({
        id: 1,
        volunteerId: 10,
      });
      await service.update(1, { role: ' Coroinha ' }, ADMIN);
      expect(prisma.volunteer.findMany).not.toHaveBeenCalled();
      expect(prisma.scheduleAssignment.update.mock.calls[0][0].data).toEqual({
        role: 'coroinha',
      });
    });

    it('400 ao trocar para voluntário de outra pastoral', async () => {
      pre();
      prisma.volunteer.findMany.mockResolvedValue([
        { id: 11, pastoralGroupId: 3 },
      ]);
      await expect(
        service.update(1, { volunteerId: 11 }, ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('409 em duplicidade (P2002)', async () => {
      pre();
      prisma.scheduleAssignment.update.mockRejectedValue(prismaError('P2002'));
      await expect(
        service.update(1, { role: 'coroinha' }, ADMIN),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    const pre = (pg = 2) => {
      scheduleOf(pg);
      prisma.scheduleAssignment.findUnique.mockResolvedValue({
        id: 1,
        scheduleId: 's1',
      });
    };

    it('409 ao remover a ÚLTIMA atribuição (a escala nunca fica vazia)', async () => {
      pre();
      prisma.scheduleAssignment.count.mockResolvedValue(1);
      await expect(service.remove(1, ADMIN)).rejects.toThrow(
        /ao menos uma atribuição/,
      );
      expect(prisma.scheduleAssignment.delete).not.toHaveBeenCalled();
    });

    it('403 ao remover atribuição de outra pastoral', async () => {
      pre(3);
      await expect(service.remove(1, COORD)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.scheduleAssignment.delete).not.toHaveBeenCalled();
    });

    it('remove quando sobra ao menos 1', async () => {
      pre();
      prisma.scheduleAssignment.count.mockResolvedValue(2);
      prisma.scheduleAssignment.delete.mockResolvedValue({ id: 1 });
      await expect(service.remove(1, COORD)).resolves.toEqual({ id: 1 });
    });

    it('404 se a atribuição some entre a leitura e o lock (corrida com remoção da escala)', async () => {
      pre();
      prisma.scheduleAssignment.findUnique
        .mockResolvedValueOnce({ id: 1, scheduleId: 's1' })
        .mockResolvedValueOnce(null);
      await expect(service.remove(1, ADMIN)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('Coordenador só lista atribuições da própria pastoral; sem pastoral => []', async () => {
      prisma.scheduleAssignment.findMany.mockResolvedValue([]);
      await service.findAll(COORD);
      expect(prisma.scheduleAssignment.findMany.mock.calls[0][0].where).toEqual(
        { schedule: { pastoralGroupId: 2 } },
      );
      await expect(service.findAll(COORD_SEM_PASTORAL)).resolves.toEqual([]);
    });
  });
});
