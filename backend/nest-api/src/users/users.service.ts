// src/users/users.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { Prisma, UserStatus } from '../../generated/prisma/client';
import { ROLE_NAMES } from '../common/constrants/role-names.constants';

const SALT_ROUNDS = 10; // mesmo custo do DUMMY_HASH no AuthService e do seed
const ADMIN_LOCK_KEY = 420001; // chave arbitrária do advisory lock "conjunto de Admins Gerais"

const USER_INCLUDE = {
  role: { select: { id: true, name: true } },
  pastoralGroup: { select: { id: true, name: true } },
} satisfies Prisma.UserInclude;

// O hash nunca sai do banco, exceto em findByEmail (Auth)
const USER_OMIT = { passwordHash: true } satisfies Prisma.UserOmit;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- UC001 ----------
  async create(dto: CreateUserDto) {
    const { password, ...data } = dto;
    const pastoralGroupId = dto.pastoralGroupId ?? null;

    const role = await this.getRoleOrFail(dto.roleId);
    await this.assertPastoralRule(role, pastoralGroupId);

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      return await this.prisma.user.create({
        data: { ...data, pastoralGroupId, passwordHash },
        include: USER_INCLUDE,
        omit: USER_OMIT,
      });
    } catch (error) {
      this.rethrowKnown(error);
    }
  }

  // ---------- UC004 ----------
  findAll(query: ListUsersQueryDto = {}) {
    return this.prisma.user.findMany({
      where: { roleId: query.roleId, status: query.status },
      include: USER_INCLUDE,
      omit: USER_OMIT,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: USER_INCLUDE,
      omit: USER_OMIT,
    });
    if (!user)
      throw new NotFoundException(`Usuário com id ${id} não encontrado`);
    return user;
  }

  /** Único ponto que devolve o hash: uso exclusivo do AuthService. */
  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: { select: { id: true, name: true } } },
    });
  }

  // ---------- UC002 / UC003 ----------
  async update(id: string, dto: UpdateUserDto) {
    const current = await this.findOne(id);

    // Estado resultante (cargo + pastoral) é o que precisa respeitar a RN006
    const roleChanged =
      dto.roleId !== undefined && dto.roleId !== current.roleId;
    const nextRole = roleChanged
      ? await this.getRoleOrFail(dto.roleId!)
      : current.role;
    const isCoordinator = nextRole.name === ROLE_NAMES.COORDENADOR;

    // Saiu de Coordenador -> zera pastoral. Continua Coordenador -> mantém a atual.
    const nextPastoral =
      dto.pastoralGroupId ?? (isCoordinator ? current.pastoralGroupId : null);
    await this.assertPastoralRule(nextRole, nextPastoral);

    const data: Prisma.UserUncheckedUpdateInput = {
      ...dto,
      pastoralGroupId: nextPastoral,
    };

    // UC003: a operação tira um Admin Geral ativo do conjunto? (inativar OU rebaixar)
    const removesActiveAdmin =
      current.role.name === ROLE_NAMES.ADMIN &&
      current.status === UserStatus.ACTIVE &&
      (nextRole.name !== ROLE_NAMES.ADMIN ||
        dto.status === UserStatus.INACTIVE);

    try {
      if (!removesActiveAdmin) {
        return await this.prisma.user.update({
          where: { id },
          data,
          include: USER_INCLUDE,
          omit: USER_OMIT,
        });
      }

      return await this.prisma.$transaction(async (tx) => {
        await this.lockAdmins(tx);
        await this.assertAnotherActiveAdmin(tx, id);
        return tx.user.update({
          where: { id },
          data,
          include: USER_INCLUDE,
          omit: USER_OMIT,
        });
      });
    } catch (error) {
      this.rethrowKnown(error);
    }
  }

  // ---------- UC002 (ação específica de senha) ----------
  async changePassword(id: string, newPassword: string) {
    await this.findOne(id); // 404 se não existe
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { id, passwordChanged: true };
  }

  // ---------- remoção ----------
  async remove(id: string, actorId: string) {
    if (id === actorId) {
      throw new ConflictException(
        'Você não pode remover o seu próprio usuário.',
      );
    }
    const current = await this.findOne(id);

    const isActiveAdmin =
      current.role.name === ROLE_NAMES.ADMIN &&
      current.status === UserStatus.ACTIVE;

    try {
      if (!isActiveAdmin) {
        return await this.prisma.user.delete({
          where: { id },
          omit: USER_OMIT,
        });
      }
      return await this.prisma.$transaction(async (tx) => {
        await this.lockAdmins(tx);
        await this.assertAnotherActiveAdmin(tx, id);
        return tx.user.delete({ where: { id }, omit: USER_OMIT });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Este usuário possui registros vinculados (comunicados ou auditoria). Inative-o em vez de removê-lo.',
        );
      }
      this.rethrowKnown(error);
    }
  }

  // ---------- helpers ----------
  private async getRoleOrFail(roleId: number) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new BadRequestException('Cargo informado não existe.');
    return role;
  }

  /** RN006: só Coordenador de Pastoral tem pastoral, e ele é obrigado a ter. */
  private async assertPastoralRule(
    role: { name: string },
    pastoralGroupId: number | null,
  ) {
    if (role.name === ROLE_NAMES.COORDENADOR) {
      if (pastoralGroupId == null) {
        throw new BadRequestException(
          'Coordenador de Pastoral deve ter uma pastoral vinculada.',
        );
      }
      const pastoral = await this.prisma.pastoralGroup.findUnique({
        where: { id: pastoralGroupId },
        select: { id: true },
      });
      if (!pastoral)
        throw new BadRequestException('Pastoral informada não existe.');
    } else if (pastoralGroupId != null) {
      throw new BadRequestException(
        'Apenas Coordenador de Pastoral pode ter pastoral vinculada.',
      );
    }
  }

  /** Serializa operações que alteram o conjunto de Admins ativos (evita o "dois inativam um ao outro"). */
  private async lockAdmins(tx: Prisma.TransactionClient) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(CAST(${ADMIN_LOCK_KEY} AS bigint))`;
  }

  private async assertAnotherActiveAdmin(
    tx: Prisma.TransactionClient,
    userId: string,
  ) {
    const others = await tx.user.count({
      where: {
        id: { not: userId },
        status: UserStatus.ACTIVE,
        role: { name: ROLE_NAMES.ADMIN },
      },
    });
    if (others === 0) {
      throw new ConflictException(
        'Não é possível inativar, remover ou rebaixar o último Admin Geral ativo do sistema.',
      );
    }
  }

  private rethrowKnown(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Já existe um usuário com esse e-mail.');
    }
    throw error;
  }
}
