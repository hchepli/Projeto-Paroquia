// src/common/filters/prisma-exception.filter.spec.ts
import { ArgumentsHost } from '@nestjs/common';
import { PrismaExceptionFilter } from './prisma-exception.filter';
import { Prisma } from '../../../generated/prisma/client';

const makeHost = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = { switchToHttp: () => ({ getResponse: () => ({ status }) }) } as unknown as ArgumentsHost;
  return { host, status, json };
};

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('x', { code, clientVersion: 't' });

describe('PrismaExceptionFilter', () => {
  const filter = new PrismaExceptionFilter();

  it.each([
    ['P2002', 409],
    ['P2003', 409],
    ['P2025', 404],
  ])('%s vira %i', (code, expected) => {
    const { host, status, json } = makeHost();
    filter.catch(prismaError(code), host);
    expect(status).toHaveBeenCalledWith(expected);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: expected }));
  });

  it('código não mapeado vira 500 sem vazar detalhes', () => {
    const { host, status, json } = makeHost();
    jest.spyOn(filter['logger'], 'error').mockImplementation();
    filter.catch(prismaError('P9999'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain('P9999');
  });
});