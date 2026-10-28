import { Test } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  AttendanceConfirmationsService,
  PRESENCE_MESSAGE,
} from './attendance-confirmations.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('x', {
    code,
    clientVersion: 'test',
  });

const HOUR = 3_600_000;
const dto = { eventId: 1, name: 'João da Silva', contact: '47999990000' };

describe('AttendanceConfirmationsService', () => {
  let service: AttendanceConfirmationsService;
  const prismaMock: any = {
    event: { findUnique: jest.fn() },
    attendanceConfirmation: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };
  const futureEvent = () => ({
    id: 1,
    status: 'ACTIVE',
    startDate: new Date(Date.now() + 24 * HOUR),
    endDate: null,
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AttendanceConfirmationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(AttendanceConfirmationsService);
  });

  describe('create (UC035)', () => {
    it('404 se o evento não existe', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(prismaMock.attendanceConfirmation.create).not.toHaveBeenCalled();
    });

    it('409 se o evento está cancelado', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        ...futureEvent(),
        status: 'CANCELLED',
      });
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prismaMock.attendanceConfirmation.create).not.toHaveBeenCalled();
    });

    it('422 se o evento já terminou (com endDate)', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        ...futureEvent(),
        startDate: new Date(Date.now() - 48 * HOUR),
        endDate: new Date(Date.now() - 24 * HOUR),
      });
      await expect(service.create(dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('422 se sem endDate e o início foi há mais de 24h', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        ...futureEvent(),
        startDate: new Date(Date.now() - 30 * HOUR),
      });
      await expect(service.create(dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('aceita se sem endDate e o início foi há 2h (confirmação no próprio dia)', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        ...futureEvent(),
        startDate: new Date(Date.now() - 2 * HOUR),
      });
      prismaMock.attendanceConfirmation.create.mockResolvedValue({});
      await expect(service.create(dto)).resolves.toEqual({
        message: PRESENCE_MESSAGE,
      });
    });

    it('grava com o IP e responde só { message } (sem eco de dados, RN012)', async () => {
      prismaMock.event.findUnique.mockResolvedValue(futureEvent());
      prismaMock.attendanceConfirmation.create.mockResolvedValue({
        id: 'x',
        contact: dto.contact,
      });
      const result = await service.create(dto, '203.0.113.9');
      expect(prismaMock.attendanceConfirmation.create).toHaveBeenCalledWith({
        data: {
          eventId: 1,
          name: 'João da Silva',
          contact: '47999990000',
          ipAddress: '203.0.113.9',
        },
      });
      expect(result).toEqual({ message: PRESENCE_MESSAGE });
      expect(PRESENCE_MESSAGE).toMatch(/não reserva lugar/);
    });

    it('sem IP grava ipAddress null', async () => {
      prismaMock.event.findUnique.mockResolvedValue(futureEvent());
      prismaMock.attendanceConfirmation.create.mockResolvedValue({});
      await service.create(dto);
      expect(
        prismaMock.attendanceConfirmation.create.mock.calls[0][0].data
          .ipAddress,
      ).toBeNull();
    });

    it('duplicado (P2002) devolve o MESMO sucesso, sem erro', async () => {
      prismaMock.event.findUnique.mockResolvedValue(futureEvent());
      prismaMock.attendanceConfirmation.create.mockRejectedValue(
        prismaError('P2002'),
      );
      await expect(service.create(dto)).resolves.toEqual({
        message: PRESENCE_MESSAGE,
      });
    });

    it('evento removido no meio (P2003) -> 404', async () => {
      prismaMock.event.findUnique.mockResolvedValue(futureEvent());
      prismaMock.attendanceConfirmation.create.mockRejectedValue(
        prismaError('P2003'),
      );
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('erro inesperado do banco propaga', async () => {
      prismaMock.event.findUnique.mockResolvedValue(futureEvent());
      prismaMock.attendanceConfirmation.create.mockRejectedValue(
        new Error('boom'),
      );
      await expect(service.create(dto)).rejects.toThrow('boom');
    });
  });

  describe('findAll (UC036)', () => {
    it('404 se o evento não existe', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);
      await expect(service.findAll({ eventId: 9 } as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('filtra por evento, pagina e não seleciona ipAddress', async () => {
      prismaMock.event.findUnique.mockResolvedValue({ id: 1, name: 'Festa' });
      prismaMock.attendanceConfirmation.findMany.mockResolvedValue([]);
      prismaMock.attendanceConfirmation.count.mockResolvedValue(25);
      const r = await service.findAll({
        eventId: 1,
        page: 2,
        limit: 10,
      });
      const args = prismaMock.attendanceConfirmation.findMany.mock.calls[0][0];
      expect(args.where).toEqual({ eventId: 1 });
      expect(args.skip).toBe(10);
      expect(args.take).toBe(10);
      expect(args.select.ipAddress).toBeUndefined();
      expect(r.totalPages).toBe(3);
    });

    it('search procura em nome OU contato', async () => {
      prismaMock.event.findUnique.mockResolvedValue({ id: 1, name: 'Festa' });
      prismaMock.attendanceConfirmation.findMany.mockResolvedValue([]);
      prismaMock.attendanceConfirmation.count.mockResolvedValue(0);
      await service.findAll({ eventId: 1, search: 'joao' });
      expect(
        prismaMock.attendanceConfirmation.findMany.mock.calls[0][0].where.OR,
      ).toHaveLength(2);
    });
  });

  describe('remove (LGPD)', () => {
    it('404 se não existe', async () => {
      prismaMock.attendanceConfirmation.findUnique.mockResolvedValue(null);
      await expect(service.remove('uuid')).rejects.toThrow(NotFoundException);
      expect(prismaMock.attendanceConfirmation.delete).not.toHaveBeenCalled();
    });

    it('apaga e devolve só o id', async () => {
      prismaMock.attendanceConfirmation.findUnique.mockResolvedValue({
        id: 'uuid',
      });
      await expect(service.remove('uuid')).resolves.toEqual({ id: 'uuid' });
      expect(prismaMock.attendanceConfirmation.delete).toHaveBeenCalledWith({
        where: { id: 'uuid' },
      });
    });
  });
});
