import { Test } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  const prisma = { $queryRaw: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    controller = module.get(HealthController);
  });

  afterEach(() => jest.useRealTimers());

  it('live: responde ok sem tocar no banco', () => {
    expect(controller.live()).toEqual({ status: 'ok' });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('ready: ok quando o SELECT 1 responde', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    await expect(controller.ready()).resolves.toEqual({ status: 'ok' });
  });

  it('ready: 503 sem expor detalhe quando o banco falha', async () => {
    prisma.$queryRaw.mockRejectedValue(
      new Error('password authentication failed for user "postgres"'),
    );
    const err = await controller.ready().catch((e) => e);
    expect(err).toBeInstanceOf(ServiceUnavailableException);
    expect(err.getStatus()).toBe(503);
    expect(JSON.stringify(err.getResponse())).not.toContain('password');
    expect(err.getResponse()).toEqual({ status: 'unavailable' });
  });

  it('ready: 503 quando o banco trava além do timeout', async () => {
    jest.useFakeTimers();
    prisma.$queryRaw.mockReturnValue(new Promise(() => {})); // nunca resolve
    const result = controller.ready().catch((e) => e);
    await jest.advanceTimersByTimeAsync(2000);
    expect(await result).toBeInstanceOf(ServiceUnavailableException);
  });
});