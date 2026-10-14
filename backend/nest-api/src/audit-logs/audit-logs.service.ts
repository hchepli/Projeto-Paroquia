import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createAuditLogDto: CreateAuditLogDto) {
    try{
      return await this.prismaService.auditLog.create({ data: createAuditLogDto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um log de auditoria com esse nome');
      }
      throw error;
    }
  }

  findAll() {
    return this.prismaService.auditLog.findMany({
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const auditLog = await this.prismaService.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true },
        },
      },
    });
    if (!auditLog) {
      throw new NotFoundException('Log de auditoria não encontrado');
    }
    return auditLog;
  }

  async update(id: string, updateAuditLogDto: UpdateAuditLogDto) {
    await this.findOne(id);
    return await this.prismaService.auditLog.update({ where: { id }, data: updateAuditLogDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return await this.prismaService.auditLog.delete({ where: { id } });
  }
}