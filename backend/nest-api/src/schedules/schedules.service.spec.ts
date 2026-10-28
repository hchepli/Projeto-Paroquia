// src/schedules/schedules.service.spec.ts
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
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
const SECRETARIA = makeUser({ roleName: ROLE_NAMES.SECRETARIA });
const COORD = makeUser({
  roleName: ROLE_NAMES.COORDENADOR,
  pastoralGroupId: 2,
});
const COORD_SEM_PASTORAL = makeUser({
  roleName: ROLE_NAMES.COORDENADOR,
  pastoralGroupId: null,
});

const DAY = 86_400_000;
const FUTURE = new Date(Date.now() + 7 * DAY);
const PAST = new Date(Date.now() - 7 * DAY);
const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('x', { code, clientVersion: 't' });

const baseDto = {
  massId: 1,
  pastoralGroupId: 2,
  assignments: [{ volunteerId: 10, role: 'leitor' }],
};

describe('SchedulesService', () => {
  let service: SchedulesService;

  const prisma: any = {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    mass: { findUnique: jest.fn(), findMany: jest.fn() },
    event: { findUnique: jest.fn(), findMany: jest.fn() },
    massPastoralGroup: { findMany: jest.fn() },
    eventPastoralGroup: { findMany: jest.fn() },
    volunteer: { findMany: jest.fn() },
    schedule: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    scheduleAssignment: { createMany: jest.fn(), findMany: jest.fn() },
  };

  /** Caminho feliz de create (Missa 1 futura, pastoral 2 vinculada, voluntário 10 da pastoral 2). */
  function happy() {
    prisma.$queryRaw.mockResolvedValue([{ id: 1 }]);
    prisma.mass.findUnique.mockResolvedValue({
      id: 1,
      title: 'Missa',
      dateTime: FUTURE,
    });
    prisma.massPastoralGroup.findMany.mockResolvedValue([
      { pastoralGroupId: 2 },
    ]);
    prisma.schedule.findFirst.mockResolvedValue(null);
    prisma.volunteer.findMany.mockResolvedValue([
      { id: 10, pastoralGroupId: 2 },
    ]);
    prisma.schedule.create.mockResolvedValue({ id: 's1' });
    prisma.scheduleAssignment.createMany.mockResolvedValue({ count: 1 });
    prisma.schedule.findUniqueOrThrow.mockResolvedValue({
      id: 's1',
      assignments: [],
    });
    prisma.scheduleAssignment.findMany.mockResolvedValue([]); // conflitos
  }

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
    const module = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(SchedulesService);
  });

  // ------------------------------------------------------------------ RN007
  describe('create — RN007 (Missa XOR Evento)', () => {
    it.each([
      ['ambos', { massId: 1, eventId: 1 }],
      ['nenhum', {}],
      ['null explícito nos dois', { massId: null, eventId: null }],
    ])('400 com %s', async (_n, extra) => {
      await expect(
        service.create(
          { ...baseDto, massId: undefined, ...extra } as any,
          ADMIN,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------ escopo / pastoral
  describe('create — pastoral e escopo (RN006/RN008)', () => {
    it('Coordenador usa a pastoral do TOKEN e ignora o body (não dá para forjar)', async () => {
      happy();
      await service.create({ ...baseDto, pastoralGroupId: 9 }, COORD);
      expect(prisma.schedule.create).toHaveBeenCalledWith({
        data: { massId: 1, eventId: null, pastoralGroupId: 2 },
      });
    });

    it('403 se Coordenador não tem pastoral', async () => {
      await expect(service.create(baseDto, COORD_SEM_PASTORAL)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('400 se Admin/Secretaria não informa a pastoral', async () => {
      await expect(
        service.create({ ...baseDto, pastoralGroupId: undefined }, SECRETARIA),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ------------------------------------------------------------------ RN017 / origem
  describe('create — origem e RN017', () => {
    it('404 se a Missa não existe (e não a mensagem de RN017)', async () => {
      happy();
      prisma.$queryRaw.mockResolvedValue([]);
      await expect(service.create(baseDto, ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('403 (Coordenador) / 400 (Admin) se a pastoral não está vinculada à Missa', async () => {
      happy();
      prisma.massPastoralGroup.findMany.mockResolvedValue([
        { pastoralGroupId: 7 },
      ]);
      await expect(service.create(baseDto, COORD)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.create(baseDto, ADMIN)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.schedule.create).not.toHaveBeenCalled();
    });

    it('usa a junção de Evento quando a origem é Evento', async () => {
      happy();
      prisma.event.findUnique.mockResolvedValue({
        id: 5,
        name: 'Festa',
        startDate: FUTURE,
        endDate: null,
        status: 'ACTIVE',
        massId: null,
      });
      prisma.eventPastoralGroup.findMany.mockResolvedValue([
        { pastoralGroupId: 2 },
      ]);
      await service.create(
        { ...baseDto, massId: undefined, eventId: 5 },
        ADMIN,
      );
      expect(prisma.eventPastoralGroup.findMany).toHaveBeenCalled();
      expect(prisma.massPastoralGroup.findMany).not.toHaveBeenCalled();
    });

    it('409 em Evento CANCELADO (inclusive para Admin)', async () => {
      happy();
      prisma.event.findUnique.mockResolvedValue({
        id: 5,
        name: 'Festa',
        startDate: FUTURE,
        endDate: null,
        status: 'CANCELLED',
        massId: null,
      });
      prisma.eventPastoralGroup.findMany.mockResolvedValue([
        { pastoralGroupId: 2 },
      ]);
      await expect(
        service.create({ ...baseDto, massId: undefined, eventId: 5 }, ADMIN),
      ).rejects.toThrow(ConflictException);
    });

    it('Missa já realizada: 409 para Coordenador, permitido para Admin/Secretaria', async () => {
      happy();
      prisma.mass.findUnique.mockResolvedValue({
        id: 1,
        title: 'Missa',
        dateTime: PAST,
      });
      await expect(service.create(baseDto, COORD)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(baseDto, ADMIN)).resolves.toBeDefined();
      await expect(service.create(baseDto, SECRETARIA)).resolves.toBeDefined();
    });
  });

  // ------------------------------------------------------------------ unicidade
  describe('create — uma escala por (origem + pastoral)', () => {
    it('409 quando já existe (pré-checagem sob lock)', async () => {
      happy();
      prisma.schedule.findFirst.mockResolvedValue({ id: 'outra' });
      await expect(service.create(baseDto, ADMIN)).rejects.toThrow(
        /já possui escala/,
      );
      expect(prisma.schedule.create).not.toHaveBeenCalled();
    });

    it('409 com mensagem de ESCALA (não de atribuição) quando o UNIQUE estoura (P2002)', async () => {
      happy();
      prisma.schedule.create.mockRejectedValue(prismaError('P2002'));
      await expect(service.create(baseDto, ADMIN)).rejects.toThrow(
        /já possui escala/,
      );
    });

    it('400 em P2003 (FK)', async () => {
      happy();
      prisma.schedule.create.mockRejectedValue(prismaError('P2003'));
      await expect(service.create(baseDto, ADMIN)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('usa lock na origem dentro da transação', async () => {
      happy();
      await service.create(baseDto, ADMIN);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });
  });

  // ------------------------------------------------------------------ atribuições (UC020/UC021)
  describe('create — atribuições', () => {
    it('400 sem atribuições', async () => {
      await expect(
        service.create({ ...baseDto, assignments: [] }, ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('400 duplicada no request, inclusive com caixa/espaços diferentes', async () => {
      const dto = {
        ...baseDto,
        assignments: [
          { volunteerId: 10, role: 'Leitor' },
          { volunteerId: 10, role: '  leitor ' },
        ],
      };
      await expect(service.create(dto, ADMIN)).rejects.toThrow(/duplicada/);
    });

    it('400 se o voluntário não existe', async () => {
      happy();
      prisma.volunteer.findMany.mockResolvedValue([]);
      await expect(service.create(baseDto, ADMIN)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('400 se o voluntário é de OUTRA pastoral (regra no back, vale para Admin)', async () => {
      happy();
      prisma.volunteer.findMany.mockResolvedValue([
        { id: 10, pastoralGroupId: 3 },
      ]);
      await expect(service.create(baseDto, ADMIN)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.schedule.create).not.toHaveBeenCalled();
    });

    it('grava a função normalizada', async () => {
      happy();
      await service.create(
        {
          ...baseDto,
          assignments: [{ volunteerId: 10, role: '  Ministro   Eucaristia ' }],
        },
        ADMIN,
      );
      expect(prisma.scheduleAssignment.createMany).toHaveBeenCalledWith({
        data: [
          { scheduleId: 's1', volunteerId: 10, role: 'ministro eucaristia' },
        ],
      });
    });
  });

  // ------------------------------------------------------------------ conflito de horário (aviso)
  describe('create — warnings de conflito de horário', () => {
    const otherSchedule = (mass: any, event: any) => ({
      volunteerId: 10,
      volunteer: { name: 'Fulano' },
      schedule: { id: 'x1', mass, event },
    });

    it('avisa (não bloqueia) quando o voluntário está em outra celebração a ±60 min', async () => {
      happy();
      prisma.scheduleAssignment.findMany.mockResolvedValue([
        otherSchedule({ id: 99, title: 'Outra', dateTime: FUTURE }, null),
      ]);
      const res: any = await service.create(baseDto, ADMIN);
      expect(res.warnings).toHaveLength(1);
      expect(res.warnings[0].conflictsWith.title).toBe('Outra');
    });

    it('NÃO avisa quando é a mesma celebração (Evento correlacionado à própria Missa, RN002)', async () => {
      happy();
      prisma.scheduleAssignment.findMany.mockResolvedValue([
        otherSchedule(null, {
          id: 3,
          name: 'Evento',
          startDate: FUTURE,
          massId: 1,
        }),
      ]);
      const res: any = await service.create(baseDto, ADMIN);
      expect(res.warnings).toEqual([]);
    });
  });

  // ------------------------------------------------------------------ IDOR
  describe('findOne / remove — IDOR do Coordenador', () => {
    const row = (pg: number) => ({
      id: 's1',
      massId: 1,
      eventId: null,
      pastoralGroupId: pg,
      assignments: [],
      _count: { assignments: 3 },
    });

    it('404 se não existe', async () => {
      prisma.schedule.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x', ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('403 se Coordenador acessa escala de outra pastoral; 403 se não tem pastoral', async () => {
      prisma.schedule.findUnique.mockResolvedValue(row(3));
      await expect(service.findOne('s1', COORD)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne('s1', COORD_SEM_PASTORAL)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('Coordenador acessa a própria; Admin/Secretaria acessam qualquer uma', async () => {
      prisma.schedule.findUnique.mockResolvedValue(row(2));
      await expect(service.findOne('s1', COORD)).resolves.toBeDefined();
      prisma.schedule.findUnique.mockResolvedValue(row(3));
      await expect(service.findOne('s1', SECRETARIA)).resolves.toBeDefined();
    });

    it('remove: 403 em outra pastoral e NÃO deleta', async () => {
      prisma.$queryRaw.mockResolvedValue([{ id: 's1' }]);
      prisma.schedule.findUniqueOrThrow.mockResolvedValue(row(3));
      await expect(service.remove('s1', COORD)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.schedule.delete).not.toHaveBeenCalled();
    });

    it('remove: 404 se sumiu antes do lock', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      await expect(service.remove('s1', ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('remove: apaga e informa quantas atribuições caíram em cascata (RN016 visto de Escalas)', async () => {
      prisma.$queryRaw.mockResolvedValue([{ id: 's1' }]);
      prisma.schedule.findUniqueOrThrow.mockResolvedValue(row(2));
      prisma.mass.findUnique.mockResolvedValue({
        id: 1,
        title: 'M',
        dateTime: FUTURE,
      });
      prisma.schedule.delete.mockResolvedValue({});
      await expect(service.remove('s1', COORD)).resolves.toMatchObject({
        id: 's1',
        removedAssignments: 3,
      });
    });

    it('remove: Evento cancelado pode ser limpo; Missa passada só por Admin/Secretaria', async () => {
      prisma.$queryRaw.mockResolvedValue([{ id: 's1' }]);
      prisma.schedule.delete.mockResolvedValue({});
      prisma.schedule.findUniqueOrThrow.mockResolvedValue({
        ...row(2),
        massId: null,
        eventId: 5,
      });
      prisma.event.findUnique.mockResolvedValue({
        id: 5,
        name: 'E',
        startDate: FUTURE,
        endDate: null,
        status: 'CANCELLED',
        massId: null,
      });
      await expect(service.remove('s1', COORD)).resolves.toBeDefined();

      prisma.schedule.findUniqueOrThrow.mockResolvedValue(row(2));
      prisma.mass.findUnique.mockResolvedValue({
        id: 1,
        title: 'M',
        dateTime: PAST,
      });
      await expect(service.remove('s1', COORD)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.remove('s1', ADMIN)).resolves.toBeDefined();
    });
  });

  // ------------------------------------------------------------------ findAll / export
  describe('findAll / export', () => {
    it('Coordenador: where restrito à própria pastoral, ignorando o filtro da query', async () => {
      prisma.schedule.findMany.mockResolvedValueOnce([]);
      await service.findAll(COORD, { pastoralGroupId: 99 });
      expect(prisma.schedule.findMany.mock.calls[0][0].where).toEqual({
        AND: [{ pastoralGroupId: 2 }],
      });
    });

    it('Coordenador sem pastoral não vê nada (id IN ())', async () => {
      prisma.schedule.findMany.mockResolvedValueOnce([]);
      await service.findAll(COORD_SEM_PASTORAL, {});
      expect(prisma.schedule.findMany.mock.calls[0][0].where).toEqual({
        AND: [{ id: { in: [] } }],
      });
    });

    it('search + período convivem (dois OR separados dentro do AND)', async () => {
      prisma.schedule.findMany.mockResolvedValueOnce([]);
      await service.findAll(ADMIN, {
        search: 'ana',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-01-31T23:59:59.000Z',
      });
      const and = prisma.schedule.findMany.mock.calls[0][0].where.AND;
      expect(and).toHaveLength(2);
      expect(and.every((c: any) => Array.isArray(c.OR))).toBe(true);
    });

    it('ordena cronologicamente misturando Missa e Evento e pagina', async () => {
      const d1 = new Date('2026-01-01'),
        d2 = new Date('2026-02-01'),
        d3 = new Date('2026-03-01');
      prisma.schedule.findMany
        .mockResolvedValueOnce([
          { id: 'a', mass: { dateTime: d1 }, event: null },
          { id: 'c', mass: null, event: { startDate: d3 } },
          { id: 'b', mass: { dateTime: d2 }, event: null },
        ])
        .mockResolvedValueOnce([{ id: 'c' }, { id: 'b' }]);
      const res = await service.findAll(ADMIN, {
        page: 1,
        limit: 2,
        order: 'desc',
      } as any);
      expect(res.data.map((r: any) => r.id)).toEqual(['c', 'b']);
      expect(res.total).toBe(3);
      expect(res.totalPages).toBe(2);
    });

    it('export usa o MESMO where da tela (inclui search) e recusa acima do teto', async () => {
      prisma.schedule.findMany.mockResolvedValueOnce([]);
      await service.findAllForExport(ADMIN, { search: 'ana' });
      expect(
        prisma.schedule.findMany.mock.calls[0][0].where.AND[0].OR,
      ).toBeDefined();

      prisma.schedule.findMany.mockResolvedValueOnce(
        Array.from({ length: 5001 }, (_, i) => ({
          id: String(i),
          mass: null,
          event: null,
        })),
      );
      await expect(service.findAllForExport(ADMIN, {} as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ------------------------------------------------------------------ coverage / pending
  describe('coverage / pending', () => {
    const q = {
      start: '2026-01-01T00:00:00.000Z',
      end: '2026-01-31T00:00:00.000Z',
    };

    it('400 se start > end ou período > 366 dias', async () => {
      await expect(
        service.findCoverage({ start: q.end, end: q.start }, ADMIN),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.findCoverage(
          {
            start: '2025-01-01T00:00:00.000Z',
            end: '2026-06-01T00:00:00.000Z',
          },
          ADMIN,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('só considera Eventos ATIVOS (cancelado não vira pendência)', async () => {
      prisma.mass.findMany.mockResolvedValue([]);
      prisma.event.findMany.mockResolvedValue([]);
      await service.findCoverage(q, ADMIN);
      expect(prisma.event.findMany.mock.calls[0][0].where.status).toBe(
        'ACTIVE',
      );
    });

    it('Coordenador sem pastoral recebe []', async () => {
      await expect(
        service.findCoverage(q, COORD_SEM_PASTORAL),
      ).resolves.toEqual([]);
    });

    it('pending = pastorais ainda não escaladas, derivado da cobertura', async () => {
      prisma.mass.findMany.mockResolvedValue([
        {
          id: 1,
          title: 'M',
          dateTime: FUTURE,
          pastoralGroups: [
            { pastoralGroupId: 2, pastoralGroup: { name: 'Liturgia' } },
            { pastoralGroupId: 3, pastoralGroup: { name: 'Coroinhas' } },
          ],
          schedules: [{ pastoralGroupId: 2 }],
        },
      ]);
      prisma.event.findMany.mockResolvedValue([]);
      const res = await service.findPending(q, ADMIN);
      expect(res).toEqual([
        expect.objectContaining({
          sourceType: 'MASS',
          sourceId: 1,
          pastoralGroupId: 3,
          pastoralGroupName: 'Coroinhas',
        }),
      ]);
    });
  });
});
