import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    // PRISMA_LOG_QUERIES=true no .env local -> imprime cada SQL (conta queries / acha N+1)
    super({
      adapter,
      log: process.env.PRISMA_LOG_QUERIES === 'true' ? ['query'] : [],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conectado ao banco de dados via Prisma');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
