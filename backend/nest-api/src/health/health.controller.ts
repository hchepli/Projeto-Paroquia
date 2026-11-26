import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

const READY_TIMEOUT_MS = 2000;

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  // Liveness: o processo está de pé e responde. Não toca no banco.
  // Se isto falha, o orquestrador deve REINICIAR o container.
  @Public()
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  // Readiness: a API consegue atender (banco respondendo).
  // Se isto falha, o tráfego deve esperar, mas reiniciar não resolve (o problema é o banco).
  @Public()
  @Get('ready')
  async ready() {
    try {
      await this.withTimeout(this.prisma.$queryRaw`SELECT 1`, READY_TIMEOUT_MS);
      return { status: 'ok' };
    } catch (error) {
      // O detalhe vai só pro log do servidor; a resposta não expõe nada.
      this.logger.warn(
        `Readiness falhou: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException({ status: 'unavailable' });
    }
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`timeout após ${ms}ms`)),
        ms,
      );
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      clearTimeout(timer); // não deixa timer pendurado
    }
  }
}