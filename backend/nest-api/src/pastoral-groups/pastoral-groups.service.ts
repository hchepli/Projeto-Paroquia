// src/pastoral-groups/pastoral-groups.service.ts
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { ROLE_NAMES } from '../common/constrants/role-names.constants';
import { CreatePastoralGroupDto } from './dto/create-pastoral-group.dto';
import { UpdatePastoralGroupDto } from './dto/update-pastoral-group.dto';

// O que o visitante pode ver (UC034). defaultRole, createdAt e updatedAt são internos.
const PUBLIC_SELECT = {
  id: true,
  name: true,
  description: true,
  contact: true,
} satisfies Prisma.PastoralGroupSelect;

const DUPLICATE_NAME = 'Já existe uma pastoral com esse nome.';

@Injectable()
export class PastoralGroupsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreatePastoralGroupDto) {
    try {
      return await this.prismaService.pastoralGroup.create({ data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(DUPLICATE_NAME);
      }
      throw error;
    }
  }

  findAllPublic() {
    return this.prismaService.pastoralGroup.findMany({
      select: PUBLIC_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async findOnePublic(id: number) {
    const pastoral = await this.prismaService.pastoralGroup.findUnique({
      where: { id },
      select: PUBLIC_SELECT,
    });
    if (!pastoral) throw new NotFoundException('Pastoral não encontrada');
    return pastoral;
  }

  findAllInternal() {
    return this.prismaService.pastoralGroup.findMany({ orderBy: { name: 'asc' } });
  }

  async findOneInternal(id: number) {
    const pastoral = await this.prismaService.pastoralGroup.findUnique({ where: { id } });
    if (!pastoral) throw new NotFoundException('Pastoral não encontrada');
    return pastoral;
  }

  async update(id: number, dto: UpdatePastoralGroupDto, user: AuthUser) {
    const current = await this.findOneInternal(id);

    if (user.roleName === ROLE_NAMES.COORDENADOR) {
      // RN006: só a própria pastoral
      if (user.pastoralGroupId == null || id !== user.pastoralGroupId) {
        throw new ForbiddenException('Você só pode editar sua própria pastoral.');
      }
      // UC033: Coordenador edita o CONTEÚDO, não a identidade da pastoral
      if (dto.name !== undefined && dto.name !== current.name) {
        throw new ForbiddenException('Apenas o Admin Geral pode alterar o nome da pastoral.');
      }
    }

    try {
      return await this.prismaService.pastoralGroup.update({ where: { id }, data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(DUPLICATE_NAME);
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOneInternal(id);

    const [users, volunteers, schedules] = await Promise.all([
      this.prismaService.user.count({ where: { pastoralGroupId: id } }),
      this.prismaService.volunteer.count({ where: { pastoralGroupId: id } }),
      this.prismaService.schedule.count({ where: { pastoralGroupId: id } }),
    ]);

    if (users + volunteers + schedules > 0) {
      const parts = [
        users && `${users} usuário(s)`,
        volunteers && `${volunteers} voluntário(s)`,
        schedules && `${schedules} escala(s)`,
      ].filter(Boolean);

      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: `Não é possível remover: a pastoral possui ${parts.join(', ')}. Reatribua ou remova esses registros primeiro.`,
        blockers: { users, volunteers, schedules },
      });
    }

    // A FK Restrict continua sendo a defesa real contra corrida (vira 409 pelo PrismaExceptionFilter).
    // Vínculos com Missa/Evento caem em cascata, por desenho.
    return this.prismaService.pastoralGroup.delete({ where: { id } });
  }
}