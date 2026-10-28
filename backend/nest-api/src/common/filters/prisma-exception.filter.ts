// src/common/filters/prisma-exception.filter.ts  (substitui o arquivo; só entrou P2000)
import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../../generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    const map: Record<
      string,
      { status: number; message: string; error: string }
    > = {
      P2000: {
        status: 400,
        message: 'Algum campo excede o tamanho permitido.',
        error: 'Bad Request',
      },
      P2002: {
        status: 409,
        message: 'Já existe um registro com esses dados.',
        error: 'Conflict',
      },
      P2003: {
        status: 409,
        message: 'A operação conflita com um registro vinculado.',
        error: 'Conflict',
      },
      P2025: {
        status: 404,
        message: 'Registro não encontrado.',
        error: 'Not Found',
      },
    };

    const known = map[exception.code];
    if (known) {
      return res.status(known.status).json({
        statusCode: known.status,
        message: known.message,
        error: known.error,
      });
    }

    this.logger.error(
      `Erro Prisma não mapeado: ${exception.code}`,
      exception.stack,
    );
    return res
      .status(500)
      .json({ statusCode: 500, message: 'Erro interno do servidor' });
  }
}
