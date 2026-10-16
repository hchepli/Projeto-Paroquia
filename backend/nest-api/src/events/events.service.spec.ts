import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

const p2002 = () => new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: 'test' });

const createDto = { name: 'Festa Junina', startDate: '2026-06-20T18:00:00.000Z', location: 'Salão' };
const detail = { id: 1, name: 'Festa Junina', slug: 'festa-junina', _count: { attendanceConfirmations: 2 } };

describe('EventsService', () => {
  let service: EventsService;
  const prismaMock: any = {
    event: {
      findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), findUniqueOrThrow: jest.fn(),
      create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn(),
    },
    category: { findUnique: jest.fn() },
    mass: { findUnique: jest.fn() },
    pastoralGroup: { findMany: jest.fn() },
    eventPastoralGroup: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
    schedule: { findMany: jest.fn() },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    prismaMock.$transaction.mockImplementation((cb: any) => cb(prismaMock));
    prismaMock.$queryRaw.mockResolvedValue([{ id: 1 }]);
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.create.mockResolvedValue({ id: 1 });
    prismaMock.event.findUniqueOrThrow.mockResolvedValue(detail);
    const module = await Test.createTestingModule({
      providers: [EventsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(EventsService);
  });

  describe('create (UC015)', () => {
    it('gera o slug a partir do nome', async () => {
      await service.create(createDto);
      expect(prismaMock.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ slug: 'festa-junina', endDate: null }),
      });
    });

    it('colisão de slug automático -> sufixo -3 (já existem base e -2)', async () => {
      prismaMock.event.findMany.mockResolvedValue([{ slug: 'festa-junina' }, { slug: 'festa-junina-2' }]);
      await service.create(createDto);
      expect(prismaMock.event.create.mock.calls[0][0].data.slug).toBe('festa-junina-3');
    });

    it('corrida (P2002 no insert) recalcula o slug e tenta de novo', async () => {
      prismaMock.event.create.mockRejectedValueOnce(p2002()).mockResolvedValueOnce({ id: 1 });
      prismaMock.event.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ slug: 'festa-junina' }]);
      await service.create(createDto);
      expect(prismaMock.event.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.event.create.mock.calls[1][0].data.slug).toBe('festa-junina-2');
    });

    it('slug informado e duplicado -> 409, sem retry nem consulta de sufixo', async () => {
      prismaMock.event.create.mockRejectedValue(p2002());
      await expect(service.create({ ...createDto, slug: 'festa' })).rejects.toThrow(ConflictException);
      expect(prismaMock.event.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.event.findMany).not.toHaveBeenCalled();
    });

    it('nome só com símbolos usa o slug "evento"', async () => {
      await service.create({ ...createDto, name: '!!!' });
      expect(prismaMock.event.create.mock.calls[0][0].data.slug).toBe('evento');
    });

    it('400 se endDate < startDate (nada é gravado)', async () => {
      await expect(service.create({ ...createDto, endDate: '2026-06-19T00:00:00.000Z' })).rejects.toThrow(BadRequestException);
      expect(prismaMock.event.create).not.toHaveBeenCalled();
    });

    it('400 se a categoria é de comunicado', async () => {
      prismaMock.category.findUnique.mockResolvedValue({ type: 'ANNOUNCEMENT' });
      await expect(service.create({ ...createDto, categoryId: 3 })).rejects.toThrow(/categoria de eventos/);
    });

    it('400 se a missa não existe', async () => {
      prismaMock.mass.findUnique.mockResolvedValue(null);
      await expect(service.create({ ...createDto, massId: 99 })).rejects.toThrow(BadRequestException);
    });

    it('400 se alguma Pastoral não existe (RN017)', async () => {
      prismaMock.pastoralGroup.findMany.mockResolvedValue([]);
      await expect(service.create({ ...createDto, pastoralGroupIds: [9] })).rejects.toThrow(BadRequestException);
    });

    it('sincroniza Pastorais (deduplicadas) na mesma transação', async () => {
      prismaMock.pastoralGroup.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      prismaMock.eventPastoralGroup.findMany.mockResolvedValue([]);
      await service.create({ ...createDto, pastoralGroupIds: [1, 2, 2] });
      expect(prismaMock.eventPastoralGroup.createMany.mock.calls[0][0].data).toEqual([
        { eventId: 1, pastoralGroupId: 1 },
        { eventId: 1, pastoralGroupId: 2 },
      ]);
    });
  });

  describe('update (UC016/UC018)', () => {
    const saved = { startDate: new Date('2026-06-20T18:00:00.000Z'), endDate: null };

    it('404 se o evento não existe', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);
      await expect(service.update(9, { name: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('compara o novo endDate com o startDate JÁ salvo -> 400', async () => {
      prismaMock.event.findUniqueOrThrow.mockResolvedValueOnce(saved);
      await expect(service.update(1, { endDate: '2026-06-19T00:00:00.000Z' })).rejects.toThrow(BadRequestException);
      expect(prismaMock.event.update).not.toHaveBeenCalled();
    });

    it('massId: null remove o vínculo com a Missa (UC018) sem validar missa', async () => {
      prismaMock.event.findUniqueOrThrow.mockResolvedValueOnce(saved).mockResolvedValueOnce(detail);
      await service.update(1, { massId: null });
      expect(prismaMock.event.update.mock.calls[0][0].data).toEqual(expect.objectContaining({ massId: null }));
      expect(prismaMock.mass.findUnique).not.toHaveBeenCalled();
    });

    it('não regenera o slug quando só o nome muda', async () => {
      prismaMock.event.findUniqueOrThrow.mockResolvedValueOnce(saved).mockResolvedValueOnce(detail);
      await service.update(1, { name: 'Novo nome' });
      expect(prismaMock.event.update.mock.calls[0][0].data.slug).toBeUndefined();
    });

    it('slug duplicado no update -> 409', async () => {
      prismaMock.event.findUniqueOrThrow.mockResolvedValueOnce(saved);
      prismaMock.event.update.mockRejectedValue(p2002());
      await expect(service.update(1, { slug: 'outro' })).rejects.toThrow(ConflictException);
    });

    it('permite cancelar (status CANCELLED)', async () => {
      prismaMock.event.findUniqueOrThrow.mockResolvedValueOnce(saved).mockResolvedValueOnce(detail);
      await service.update(1, { status: 'CANCELLED' as any });
      expect(prismaMock.event.update.mock.calls[0][0].data.status).toBe('CANCELLED');
    });
  });

  describe('remove (RN016 / UC017)', () => {
    const schedule = { id: 's1', pastoralGroup: { id: 2, name: 'Liturgia' }, _count: { assignments: 3 } };
    const base = { id: 1, name: 'Festa', schedules: [], albums: [], _count: { attendanceConfirmations: 4 } };

    it('404 se o evento não existe', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);
      await expect(service.remove(9)).rejects.toThrow(NotFoundException);
    });

    it('409 EVENT_HAS_SCHEDULES com a lista quando falta confirm; nada é apagado', async () => {
      prismaMock.event.findUnique.mockResolvedValue({ ...base, schedules: [schedule] });
      const err: any = await service.remove(1).catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.getResponse()).toMatchObject({
        code: 'EVENT_HAS_SCHEDULES',
        schedules: [{ id: 's1', assignmentsCount: 3 }],
      });
      expect(prismaMock.event.delete).not.toHaveBeenCalled();
    });

    it('com confirm=true apaga (cascata é do banco) e informa o que foi removido', async () => {
      prismaMock.event.findUnique.mockResolvedValue({ ...base, schedules: [schedule] });
      const r = await service.remove(1, true);
      expect(prismaMock.event.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(r.removedSchedules).toBe(1);
      expect(r.removedAttendanceConfirmations).toBe(4);
    });

    it('sem escalas apaga sem exigir confirm', async () => {
      prismaMock.event.findUnique.mockResolvedValue(base);
      await service.remove(1);
      expect(prismaMock.event.delete).toHaveBeenCalled();
    });

    it('Álbum vinculado NÃO bloqueia: sai em unlinkedAlbums (UC017 4b)', async () => {
      prismaMock.event.findUnique.mockResolvedValue({ ...base, albums: [{ id: 5, title: 'Fotos' }] });
      const r = await service.remove(1);
      expect(r.unlinkedAlbums).toEqual([{ id: 5, title: 'Fotos' }]);
      expect(prismaMock.event.delete).toHaveBeenCalled();
    });
  });

  describe('vínculo de Pastorais (RN017)', () => {
    it('409 ao desvincular Pastoral que já tem escala no evento', async () => {
      prismaMock.pastoralGroup.findMany.mockResolvedValue([{ id: 1 }]);
      prismaMock.eventPastoralGroup.findMany.mockResolvedValueOnce([{ pastoralGroupId: 1 }, { pastoralGroupId: 2 }]);
      prismaMock.schedule.findMany.mockResolvedValue([{ pastoralGroup: { name: 'Coroinhas' } }]);
      await expect(service.linkPastoralGroups(1, { pastoralGroupIds: [1] })).rejects.toThrow(/Coroinhas/);
      expect(prismaMock.eventPastoralGroup.deleteMany).not.toHaveBeenCalled();
    });

    it('só adiciona/remove a diferença', async () => {
      prismaMock.pastoralGroup.findMany.mockResolvedValue([{ id: 1 }, { id: 3 }]);
      prismaMock.eventPastoralGroup.findMany
        .mockResolvedValueOnce([{ pastoralGroupId: 1 }, { pastoralGroupId: 2 }])
        .mockResolvedValueOnce([]);
      prismaMock.schedule.findMany.mockResolvedValue([]);
      await service.linkPastoralGroups(1, { pastoralGroupIds: [1, 3] });
      expect(prismaMock.eventPastoralGroup.deleteMany).toHaveBeenCalledWith({
        where: { eventId: 1, pastoralGroupId: { in: [2] } },
      });
      expect(prismaMock.eventPastoralGroup.createMany.mock.calls[0][0].data).toEqual([{ eventId: 1, pastoralGroupId: 3 }]);
    });
  });

  describe('leitura (UC019)', () => {
    beforeEach(() => {
      prismaMock.event.count.mockResolvedValue(0);
    });

    it('público: sempre status ACTIVE; upcoming em ordem crescente', async () => {
      await service.findAllPublic({ period: 'upcoming', page: 1, limit: 10 } as any);
      const args = prismaMock.event.findMany.mock.calls[0][0];
      expect(args.where.AND).toContainEqual({ status: 'ACTIVE' });
      expect(args.where.AND).toHaveLength(2); // status + período
      expect(args.orderBy).toEqual({ startDate: 'asc' });
    });

    it('past: ordem decrescente', async () => {
      await service.findAllPublic({ period: 'past' } as any);
      expect(prismaMock.event.findMany.mock.calls[0][0].orderBy).toEqual({ startDate: 'desc' });
    });

    it('search e categoryId entram no filtro', async () => {
      await service.findAllPublic({ search: 'fest', categoryId: 2 } as any);
      const and = prismaMock.event.findMany.mock.calls[0][0].where.AND;
      expect(and).toContainEqual({ name: { contains: 'fest', mode: 'insensitive' } });
      expect(and).toContainEqual({ categoryId: 2 });
    });

    it('sortBy fora da lista cai em startDate', async () => {
      await service.findAllPublic({ sortBy: 'password', order: 'asc' } as any);
      expect(prismaMock.event.findMany.mock.calls[0][0].orderBy).toEqual({ startDate: 'asc' });
    });

    it('público não seleciona status, createdAt nem contato da Pastoral', async () => {
      await service.findAllPublic({} as any);
      const select = prismaMock.event.findMany.mock.calls[0][0].select;
      expect(select.status).toBeUndefined();
      expect(select.createdAt).toBeUndefined();
      expect(select._count).toBeUndefined();
    });

    it('admin sem status vê todos (sem filtro de status)', async () => {
      await service.findAllAdmin({} as any, true);
      expect(prismaMock.event.findMany.mock.calls[0][0].where).toEqual({});
    });

    it('admin filtra CANCELLED quando pedido', async () => {
      await service.findAllAdmin({ status: 'CANCELLED' } as any, true);
      expect(prismaMock.event.findMany.mock.calls[0][0].where.AND).toContainEqual({ status: 'CANCELLED' });
    });

    it('admin: Coordenador não recebe _count de confirmações', async () => {
      prismaMock.event.findMany.mockResolvedValue([{ id: 1, _count: { attendanceConfirmations: 3 } }]);
      const hidden: any = await service.findAllAdmin({} as any, false);
      expect(hidden.data[0]._count).toBeUndefined();
      const shown: any = await service.findAllAdmin({} as any, true);
      expect(shown.data[0]._count).toEqual({ attendanceConfirmations: 3 });
    });

    it('findBySlug: só ACTIVE; 404 caso contrário', async () => {
      prismaMock.event.findFirst.mockResolvedValue(null);
      await expect(service.findBySlug('x')).rejects.toThrow(NotFoundException);
      expect(prismaMock.event.findFirst.mock.calls[0][0].where).toEqual({ slug: 'x', status: 'ACTIVE' });
    });

    it('findOnePublic: evento cancelado é 404', async () => {
      prismaMock.event.findFirst.mockResolvedValue(null);
      await expect(service.findOnePublic(1)).rejects.toThrow(NotFoundException);
      expect(prismaMock.event.findFirst.mock.calls[0][0].where).toEqual({ id: 1, status: 'ACTIVE' });
    });

    it('findOneAdmin: 404 se não existe', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);
      await expect(service.findOneAdmin(9, true)).rejects.toThrow(NotFoundException);
    });
  });
});
