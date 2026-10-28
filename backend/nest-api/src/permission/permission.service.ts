// src/permission/permission.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

const DUPLICATE_MESSAGE = 'Já existe uma permissão para esse cargo e recurso.'; // unique = (roleId, resource)

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePermissionDto) {
    await this.assertRoleExists(dto.roleId);
    try {
      return await this.prisma.permission.create({ data: dto });
    } catch (error) {
      this.rethrowKnown(error);
    }
  }

  findAll() {
    return this.prisma.permission.findMany({
      orderBy: [{ roleId: 'asc' }, { resource: 'asc' }],
    });
  }

  async findOne(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!permission) throw new NotFoundException('Permissão não encontrada');
    return permission;
  }

  async update(id: number, dto: UpdatePermissionDto) {
    await this.findOne(id);
    if (dto.roleId !== undefined) await this.assertRoleExists(dto.roleId);
    try {
      return await this.prisma.permission.update({ where: { id }, data: dto });
    } catch (error) {
      this.rethrowKnown(error);
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.permission.delete({ where: { id } });
  }

  private async assertRoleExists(roleId: number) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true },
    });
    if (!role) throw new BadRequestException('Cargo informado não existe.');
  }

  private rethrowKnown(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(DUPLICATE_MESSAGE);
    }
    throw error;
  }
}
