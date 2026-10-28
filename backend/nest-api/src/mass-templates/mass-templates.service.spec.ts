// src/mass-templates/mass-templates.service.spec.ts
import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { MassTemplatesService } from './mass-templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

const NOW = new Date('2026-10-14T12:00:00Z');
const TEMPLATE = {
  id: 1,
  dayOfWeek: 1,
  time: '19:00',
  title: 'Semanal',
  location: 'Matriz',
  type: 'COMMON',
  notes: null,
  active: true,
};

describe('MassTemplatesService', () => {
  let service: MassTemplatesService;
  const prismaMock: any = {
    massTemplate: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    mass: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    massTemplateSkip: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    prismaMock.$transaction.mockImplementation((cb: any) => cb(prismaMock));
    prismaMock.mass.findMany.mockResolvedValue([]);
    prismaMock.massTemplateSkip.findMany.mockResolvedValue([]);
    const module = await Test.createTestingModule({
      providers: [
        MassTemplatesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(MassTemplatesService);
  });

  describe('ensureGenerated', () => {
    it('não faz nada sem templates ativos', async () => {
      prismaMock.massTemplate.findMany.mockResolvedValue([]);
      await service.ensureGenerated(new Date('2026-12-01T00:00:00Z'), NOW);
      expect(prismaMock.mass.createMany).not.toHaveBeenCalled();
    });

    it('cria só as faltantes, com skipDuplicates e templateOccurrenceAt = dateTime', async () => {
      prismaMock.massTemplate.findMany.mockResolvedValue([TEMPLATE]);
      prismaMock.mass.findMany.mockResolvedValue([
        { templateOccurrenceAt: new Date('2026-10-19T22:00:00Z') },
      ]);
      await service.ensureGenerated(new Date('2026-11-01T00:00:00Z'), NOW);

      const arg = prismaMock.mass.createMany.mock.calls[0][0];
      expect(arg.skipDuplicates).toBe(true);
      expect(arg.data.map((d: any) => d.dateTime.toISOString())).not.toContain(
        '2026-10-19T22:00:00.000Z',
      );
      expect(
        arg.data.every(
          (d: any) => d.templateOccurrenceAt.getTime() === d.dateTime.getTime(),
        ),
      ).toBe(true);
    });

    it('respeita ocorrência removida (skip) e não recria', async () => {
      prismaMock.massTemplate.findMany.mockResolvedValue([TEMPLATE]);
      prismaMock.massTemplateSkip.findMany.mockResolvedValue([
        { occurrenceAt: new Date('2026-10-19T22:00:00Z') },
      ]);
      await service.ensureGenerated(new Date('2026-10-20T00:00:00Z'), NOW);
      const created = (
        prismaMock.mass.createMany.mock.calls[0]?.[0].data ?? []
      ).map((d: any) => d.dateTime.toISOString());
      expect(created).not.toContain('2026-10-19T22:00:00.000Z');
    });

    it('mínimo de 8 semanas mesmo com untilDate curto', async () => {
      prismaMock.massTemplate.findMany.mockResolvedValue([TEMPLATE]);
      await service.ensureGenerated(new Date('2026-10-15T00:00:00Z'), NOW);
      expect(prismaMock.mass.createMany.mock.calls[0][0].data).toHaveLength(8);
    });

    it('teto de 26 semanas mesmo com untilDate absurdo (M06)', async () => {
      prismaMock.massTemplate.findMany.mockResolvedValue([TEMPLATE]);
      await service.ensureGenerated(new Date('2100-01-01T00:00:00Z'), NOW);
      expect(prismaMock.mass.createMany.mock.calls[0][0].data).toHaveLength(26);
    });
  });

  describe('update', () => {
    it('400 se removeFuture sem desativar', async () => {
      await expect(service.update(1, { title: 'x' }, true)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('desativar + removeFuture apaga só futuras sem escala e informa as mantidas', async () => {
      prismaMock.massTemplate.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.massTemplate.update.mockResolvedValue({
        ...TEMPLATE,
        active: false,
      });
      prismaMock.mass.deleteMany.mockResolvedValue({ count: 5 });
      prismaMock.mass.count.mockResolvedValue(2);

      const r: any = await service.update(1, { active: false }, true);

      expect(
        prismaMock.mass.deleteMany.mock.calls[0][0].where.schedules,
      ).toEqual({ none: {} });
      expect(r.removed).toBe(5);
      expect(r.keptWithSchedule).toBe(2);
    });

    it('409 amigável se o slot já existe (P2002)', async () => {
      prismaMock.massTemplate.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.massTemplate.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('x', {
          code: 'P2002',
          clientVersion: 't',
        }),
      );
      await expect(service.update(1, { location: 'Outro' })).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
