// src/common/filters/prisma-exception.filter.ts
import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../../generated/prisma/client';

/**
 * Rede de segurança: erros conhecidos do Prisma que os services não trataram
 * deixam de virar 500. Os services continuam lançando mensagens específicas
 * onde existem; este filtro só pega o que escapar.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    const map: Record<string, { status: number; message: string }> = {
      P2002: { status: 409, message: 'Já existe um registro com esses dados.' },
      P2003: { status: 409, message: 'A operação conflita com um registro vinculado.' },
      P2025: { status: 404, message: 'Registro não encontrado.' },
    };

    const known = map[exception.code];
    if (known) {
      return res.status(known.status).json({
        statusCode: known.status,
        message: known.message,
        error: known.status === 404 ? 'Not Found' : 'Conflict',
      });
    }

    this.logger.error(`Erro Prisma não mapeado: ${exception.code}`, exception.stack);
    return res.status(500).json({ statusCode: 500, message: 'Erro interno do servidor' });
  }
}