import { NotFoundException } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';

describe('AuditLogsService', () => {
  let prisma: {
    auditLog: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let service: AuditLogsService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
      },
    };
    service = new AuditLogsService(prisma as any);
  });

  it('create: repassa o DTO ao Prisma', async () => {
    const dto = {
      userId: 'u1',
      action: 'CREATE',
      entity: 'Mass',
      entityId: '1',
    } as any;
    prisma.auditLog.create.mockResolvedValue({ id: 'l1', ...dto });
    await expect(service.create(dto)).resolves.toMatchObject({ id: 'l1' });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({ data: dto });
  });

  it('findAll: defaults (página 1, limite 20), ordem estável e SEM JSONs no select', async () => {
    prisma.auditLog.findMany.mockResolvedValue([{ id: 'l1' }]);
    prisma.auditLog.count.mockResolvedValue(1);

    const result = await service.findAll({});

    const arg = prisma.auditLog.findMany.mock.calls[0][0];
    expect(arg.skip).toBe(0);
    expect(arg.take).toBe(20);
    expect(arg.orderBy).toEqual([{ createdAt: 'desc' }, { id: 'desc' }]);
    expect(arg.select).toBeDefined();
    expect(arg.select.previousData).toBeUndefined();
    expect(arg.select.newData).toBeUndefined();
    expect(arg.where).toEqual({});
    expect(result).toEqual({ data: [{ id: 'l1' }], total: 1, page: 1, limit: 20 });
  });

  it('findAll: calcula skip pela página', async () => {
    await service.findAll({ page: 3, limit: 10 });
    const arg = prisma.auditLog.findMany.mock.calls[0][0];
    expect(arg.skip).toBe(20);
    expect(arg.take).toBe(10);
  });

  it('findAll: monta filtros e usa o mesmo where no count', async () => {
    await service.findAll({
      entity: 'Mass',
      action: 'UPDATE' as any,
      userId: 'u1',
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2026-10-31T23:59:59.999Z',
    });
    const where = prisma.auditLog.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({
      entity: 'Mass',
      action: 'UPDATE',
      userId: 'u1',
    });
    expect(where.createdAt.gte).toEqual(new Date('2026-10-01T00:00:00.000Z'));
    expect(where.createdAt.lte).toEqual(new Date('2026-10-31T23:59:59.999Z'));
    expect(prisma.auditLog.count).toHaveBeenCalledWith({ where });
  });

  it('findOne: devolve o log completo', async () => {
    prisma.auditLog.findUnique.mockResolvedValue({ id: 'l1', previousData: {} });
    await expect(service.findOne('l1')).resolves.toMatchObject({ id: 'l1' });
  });

  it('findOne: 404 quando não existe', async () => {
    prisma.auditLog.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('é append-only: não expõe update nem remove', () => {
    expect((service as any).update).toBeUndefined();
    expect((service as any).remove).toBeUndefined();
  });
});