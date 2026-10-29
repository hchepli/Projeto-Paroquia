import { AuditLogsController } from './audit-logs.controller';

describe('AuditLogsController', () => {
  let service: { findAll: jest.Mock; findOne: jest.Mock };
  let controller: AuditLogsController;

  beforeEach(() => {
    jest.resetAllMocks();
    service = { findAll: jest.fn(), findOne: jest.fn() };
    controller = new AuditLogsController(service as any);
  });

  it('findAll repassa a query ao service', async () => {
    service.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });
    await controller.findAll({ limit: 10 } as any);
    expect(service.findAll).toHaveBeenCalledWith({ limit: 10 });
  });

  it('findOne repassa o id ao service', async () => {
    service.findOne.mockResolvedValue({ id: 'l1' });
    await controller.findOne('l1');
    expect(service.findOne).toHaveBeenCalledWith('l1');
  });

  it('não expõe POST/PATCH/DELETE (ninguém forja nem altera log)', () => {
    expect((controller as any).create).toBeUndefined();
    expect((controller as any).update).toBeUndefined();
    expect((controller as any).remove).toBeUndefined();
  });
});