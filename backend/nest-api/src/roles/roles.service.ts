// src/roles/roles.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Prisma } from '../../generated/prisma/client';

// _count de usuários: o front usa para avisar antes de remover (UC006)
const WITH_USER_COUNT = {
  _count: { select: { users: true } },
} satisfies Prisma.RoleInclude;

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    try {
      // isBase nunca vem do body: cargo criado via CRUD é sempre não-base
      return await this.prisma.role.create({
        data: dto,
        include: WITH_USER_COUNT,
      });
    } catch (error) {
      this.rethrowKnown(error);
    }
  }

  findAll() {
    return this.prisma.role.findMany({
      include: WITH_USER_COUNT,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: WITH_USER_COUNT,
    });
    if (!role) throw new NotFoundException(`Cargo com id ${id} não encontrado`);
    return role;
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.findOne(id);

    // As guards comparam por NOME: renomear um cargo base tranca todo mundo para fora
    if (role.isBase && dto.name !== undefined && dto.name !== role.name) {
      throw new ConflictException('Cargos base não podem ser renomeados.');
    }

    try {
      return await this.prisma.role.update({
        where: { id },
        data: dto,
        include: WITH_USER_COUNT,
      });
    } catch (error) {
      this.rethrowKnown(error);
    }
  }

  async remove(id: number, confirmBase = false) {
    const role = await this.findOne(id);

    if (role._count.users > 0) {
      throw new ConflictException(
        `Não é possível remover: ${role._count.users} usuário(s) vinculado(s) a este cargo. Reatribua-os antes.`,
      );
    }
    if (role.isBase && !confirmBase) {
      throw new ConflictException(
        'Este é um cargo base do sistema. Remover exige confirmação extra (confirmBase=true).',
      );
    }

    try {
      return await this.prisma.role.delete({ where: { id } });
    } catch (error) {
      // Defesa final: um usuário foi vinculado entre a checagem e o delete (FK Restrict)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Não é possível remover: há usuários vinculados a este cargo.',
        );
      }
      throw error;
    }
  }

  private rethrowKnown(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Já existe um cargo com esse nome');
    }
    throw error;
  }
}
