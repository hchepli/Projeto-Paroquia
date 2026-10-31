import { Test } from '@nestjs/testing';
import { BadRequestException, Logger } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { PrismaService } from '../prisma/prisma.service';
import { MassTemplatesService } from '../mass-templates/mass-templates.service';

const RANGE = {
  start: '2026-11-01T00:00:00.000Z',
  end: '2026-11-30T23:59:59.999Z',
};

describe('CalendarService', () => {
  let service: CalendarService;
  let prisma: any;
  let templates: any;
  let warnSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.resetAllMocks();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    prisma = {
      mass: { findMany: jest.fn().mockResolvedValue([]) },
      event: { findMany: jest.fn().mockResolvedValue([]) },
    };
    templates = { ensureGenerated: jest.fn().mockResolvedValue(undefined) };

    const mod = await Test.createTestingModule({
      providers: [
        CalendarService,
        { provide: PrismaService, useValue: prisma },
        { provide: MassTemplatesService, useValue: templates },
      ],
    }).compile();
    service = mod.get(CalendarService);
  });

  it('400 se start > end, sem gerar nem consultar', async () => {
    await expect(
      service.findAll({ start: RANGE.end, end: RANGE.start }),
    ).rejects.toThrow(BadRequestException);
    expect(templates.ensureGenerated).not.toHaveBeenCalled();
    expect(prisma.mass.findMany).not.toHaveBeenCalled();
  });

  it('400 se a janela passa de 366 dias', async () => {
    await expect(
      service.findAll({
        start: '2026-01-01T00:00:00.000Z',
        end: '2027-03-01T00:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(templates.ensureGenerated).not.toHaveBeenCalled();
  });

  it('chama ensureGenerated com o fim do período, ANTES de consultar', async () => {
    await service.findAll(RANGE);
    expect(templates.ensureGenerated).toHaveBeenCalledWith(new Date(RANGE.end));
    expect(templates.ensureGenerated.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.mass.findMany.mock.invocationCallOrder[0],
    );
  });

  it('junta Missas e Eventos ordenados por data, com type correto', async () => {
    prisma.mass.findMany.mockResolvedValue([
      { id: 1, title: 'Missa B', dateTime: new Date('2026-11-10T22:00:00Z') },
      { id: 2, title: 'Missa A', dateTime: new Date('2026-11-02T22:00:00Z') },
    ]);
    prisma.event.findMany.mockResolvedValue([
      { id: 7, name: 'Festa', startDate: new Date('2026-11-05T20:00:00Z') },
    ]);

    const r = await service.findAll(RANGE);

    expect(r.map((i) => `${i.type}:${i.id}`)).toEqual(['mass:2', 'event:7', 'mass:1']);
    expect(r[1]).toEqual({
      id: 7,
      title: 'Festa',
      date: '2026-11-05T20:00:00.000Z',
      type: 'event',
    });
  });

  it('só consulta eventos ACTIVE dentro do período', async () => {
    await service.findAll(RANGE);
    expect(prisma.event.findMany.mock.calls[0][0].where).toEqual({
      startDate: { gte: new Date(RANGE.start), lte: new Date(RANGE.end) },
      status: 'ACTIVE',
    });
  });

  it('se ensureGenerated falhar, ainda devolve a lista e registra warn', async () => {
    templates.ensureGenerated.mockRejectedValue(new Error('db off'));
    prisma.mass.findMany.mockResolvedValue([
      { id: 1, title: 'Missa', dateTime: new Date('2026-11-10T22:00:00Z') },
    ]);

    const r = await service.findAll(RANGE);

    expect(r).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalled();
  });
});