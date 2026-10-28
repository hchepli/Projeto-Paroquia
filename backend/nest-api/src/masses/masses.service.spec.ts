// src/masses/masses.service.spec.ts
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { MassesService } from './masses.service';
import { PrismaService } from '../prisma/prisma.service';

const baseMass = {
  id: 1,
  title: 'M',
  dateTime: new Date(),
  generatedFromTemplateId: null,
  templateOccurrenceAt: null,
  events: [],
};

describe('MassesService', () => {
  let service: MassesService;
  const prismaMock: any = {
    mass: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    massTemplateSkip: { createMany: jest.fn() },
    massPastoralGroup: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    pastoralGroup: { findMany: jest.fn() },
    schedule: { findMany: jest.fn() },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    prismaMock.$transaction.mockImplementation((cb: any) => cb(prismaMock));
    prismaMock.$queryRaw.mockResolvedValue([{ id: 1 }]);
    const module = await Test.createTestingModule({
      providers: [
        MassesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(MassesService);
  });

  describe('remove (RN016)', () => {
    const schedule = {
      id: 's1',
      pastoralGroup: { id: 2, name: 'Liturgia' },
      _count: { assignments: 3 },
    };

    it('404 se a missa não existe', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);
      await expect(service.remove(9)).rejects.toThrow(NotFoundException);
    });

    it('409 com a lista de escalas quando falta confirm; nada é apagado', async () => {
      prismaMock.mass.findUnique.mockResolvedValue({
        ...baseMass,
        schedules: [schedule],
      });
      const err: any = await service.remove(1).catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.getResponse()).toMatchObject({
        code: 'MASS_HAS_SCHEDULES',
        schedules: [{ id: 's1', assignmentsCount: 3 }],
      });
      expect(prismaMock.mass.delete).not.toHaveBeenCalled();
    });

    it('com confirm=true apaga (cascata é do banco)', async () => {
      prismaMock.mass.findUnique.mockResolvedValue({
        ...baseMass,
        schedules: [schedule],
      });
      const r = await service.remove(1, true);
      expect(prismaMock.mass.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(r.removedSchedules).toBe(1);
    });

    it('sem escalas apaga sem exigir confirm', async () => {
      prismaMock.mass.findUnique.mockResolvedValue({
        ...baseMass,
        schedules: [],
      });
      await service.remove(1);
      expect(prismaMock.mass.delete).toHaveBeenCalled();
    });

    it('missa gerada por template grava o skip na mesma transação', async () => {
      const at = new Date('2026-10-19T22:00:00Z');
      prismaMock.mass.findUnique.mockResolvedValue({
        ...baseMass,
        generatedFromTemplateId: 7,
        templateOccurrenceAt: at,
        schedules: [],
      });
      await service.remove(1);
      expect(prismaMock.massTemplateSkip.createMany).toHaveBeenCalledWith({
        data: [{ templateId: 7, occurrenceAt: at }],
        skipDuplicates: true,
      });
    });

    it('missa avulsa NÃO grava skip', async () => {
      prismaMock.mass.findUnique.mockResolvedValue({
        ...baseMass,
        schedules: [],
      });
      await service.remove(1);
      expect(prismaMock.massTemplateSkip.createMany).not.toHaveBeenCalled();
    });
  });

  describe('vínculo de Pastorais (RN017)', () => {
    it('400 se alguma Pastoral não existe', async () => {
      prismaMock.pastoralGroup.findMany.mockResolvedValue([{ id: 1 }]);
      await expect(
        service.linkPastoralGroups(1, { pastoralGroupIds: [1, 2] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('409 ao desvincular Pastoral que já tem escala', async () => {
      prismaMock.pastoralGroup.findMany.mockResolvedValue([{ id: 1 }]);
      prismaMock.massPastoralGroup.findMany.mockResolvedValueOnce([
        { pastoralGroupId: 1 },
        { pastoralGroupId: 2 },
      ]);
      prismaMock.schedule.findMany.mockResolvedValue([
        { pastoralGroup: { name: 'Coroinhas' } },
      ]);
      await expect(
        service.linkPastoralGroups(1, { pastoralGroupIds: [1] }),
      ).rejects.toThrow(/Coroinhas/);
      expect(prismaMock.massPastoralGroup.deleteMany).not.toHaveBeenCalled();
    });

    it('só adiciona/remove a diferença', async () => {
      prismaMock.pastoralGroup.findMany.mockResolvedValue([
        { id: 1 },
        { id: 3 },
      ]);
      prismaMock.massPastoralGroup.findMany
        .mockResolvedValueOnce([{ pastoralGroupId: 1 }, { pastoralGroupId: 2 }])
        .mockResolvedValueOnce([]);
      prismaMock.schedule.findMany.mockResolvedValue([]);
      await service.linkPastoralGroups(1, { pastoralGroupIds: [1, 3] });
      expect(prismaMock.massPastoralGroup.deleteMany).toHaveBeenCalledWith({
        where: { massId: 1, pastoralGroupId: { in: [2] } },
      });
      expect(
        prismaMock.massPastoralGroup.createMany.mock.calls[0][0].data,
      ).toEqual([{ massId: 1, pastoralGroupId: 3 }]);
    });
  });
});
