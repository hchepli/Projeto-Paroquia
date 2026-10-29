import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

// Lista resumida: SEM previousData/newData (JSONs pesados e com dados pessoais).
const LIST_SELECT = {
  id: true,
  userId: true,
  action: true,
  entity: true,
  entityId: true,
  createdAt: true,
  user: { select: { name: true } },
} satisfies Prisma.AuditLogSelect;

// Desempate por id: paginação estável quando há logs no mesmo instante.
const ORDER_BY: Prisma.AuditLogOrderByWithRelationInput[] = [
  { createdAt: 'desc' },
  { id: 'desc' },
];

// Auditoria é APPEND-ONLY: só create (uso interno do interceptor), listar e detalhar.
@Injectable()
export class AuditLogsService {
  constructor(private readonly prismaService: PrismaService) {}

  create(dto: CreateAuditLogDto) {
    return this.prismaService.auditLog.create({ data: dto });
  }

  async findAll(query: QueryAuditLogsDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.AuditLogWhereInput = {
      ...(query.entity ? { entity: query.entity } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prismaService.auditLog.findMany({
        where,
        select: LIST_SELECT,
        orderBy: ORDER_BY,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prismaService.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // Detalhe COMPLETO (com JSONs): restrito a Admin Geral no controller.
  async findOne(id: string) {
    const auditLog = await this.prismaService.auditLog.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    });
    if (!auditLog) {
      throw new NotFoundException('Log de auditoria não encontrado');
    }
    return auditLog;
  }
}