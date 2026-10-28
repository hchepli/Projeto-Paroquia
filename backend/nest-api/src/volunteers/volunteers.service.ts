// src/volunteers/volunteers.service.ts
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { ROLE_NAMES } from '../common/constrants/role-names.constants';
import { CreateVolunteerDto } from './dto/create-volunteer.dto';
import { UpdateVolunteerDto } from './dto/update-volunteer.dto';
import { FindVolunteersQueryDto } from './dto/find-volunteers-query.dto';

const volunteerInclude = {
  pastoralGroup: { select: { id: true, name: true } },
} satisfies Prisma.VolunteerInclude;

@Injectable()
export class VolunteersService {
  constructor(private readonly prismaService: PrismaService) {}

  private isCoordinator(user: AuthUser) {
    return user.roleName === ROLE_NAMES.COORDENADOR;
  }

  // null === null NÃO pode liberar acesso: Coordenador sem pastoral não é dono de nada.
  private ownsPastoral(user: AuthUser, pastoralGroupId: number) {
    return (
      user.pastoralGroupId != null && user.pastoralGroupId === pastoralGroupId
    );
  }

  private async assertPastoralExists(id: number) {
    const pastoral = await this.prismaService.pastoralGroup.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!pastoral) throw new NotFoundException('Pastoral não encontrada');
  }

  /** Atribuições do voluntário em escalas, com flag de futura (UC009). */
  private async findAssignments(volunteerId: number) {
    const rows = await this.prismaService.scheduleAssignment.findMany({
      where: { volunteerId },
      select: {
        role: true,
        schedule: {
          select: {
            id: true,
            mass: { select: { title: true, dateTime: true } },
            event: { select: { name: true, startDate: true, endDate: true } },
          },
        },
      },
    });

    const now = new Date();
    return rows
      .map((r) => {
        const date =
          r.schedule.mass?.dateTime ?? r.schedule.event?.startDate ?? null;
        const end =
          r.schedule.mass?.dateTime ??
          r.schedule.event?.endDate ??
          r.schedule.event?.startDate ??
          null;
        return {
          scheduleId: r.schedule.id,
          sourceType: r.schedule.mass ? ('MASS' as const) : ('EVENT' as const),
          title: r.schedule.mass?.title ?? r.schedule.event?.name ?? '—',
          role: r.role,
          date,
          isFuture: end !== null && end >= now,
        };
      })
      .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
  }

  async create(dto: CreateVolunteerDto, user: AuthUser) {
    if (
      this.isCoordinator(user) &&
      !this.ownsPastoral(user, dto.pastoralGroupId)
    ) {
      throw new ForbiddenException(
        'Você só pode cadastrar Voluntários para a sua própria Pastoral (RN006).',
      );
    }
    await this.assertPastoralExists(dto.pastoralGroupId);

    const { pastoralGroupId, ...rest } = dto;
    return this.prismaService.volunteer.create({
      data: { ...rest, pastoralGroup: { connect: { id: pastoralGroupId } } },
      include: volunteerInclude,
    });
  }

  async findAll(user: AuthUser, query: FindVolunteersQueryDto) {
    let scopedId: number | undefined;
    if (this.isCoordinator(user)) {
      if (user.pastoralGroupId == null) return [];
      scopedId = user.pastoralGroupId; // ignora qualquer filtro vindo da query
    } else {
      scopedId = query.pastoralGroupId;
    }

    return this.prismaService.volunteer.findMany({
      where: scopedId ? { pastoralGroupId: scopedId } : undefined,
      include: volunteerInclude,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number, user: AuthUser) {
    const volunteer = await this.prismaService.volunteer.findUnique({
      where: { id },
      include: volunteerInclude,
    });
    if (!volunteer) throw new NotFoundException('Voluntário não encontrado');

    if (
      this.isCoordinator(user) &&
      !this.ownsPastoral(user, volunteer.pastoralGroupId)
    ) {
      throw new ForbiddenException('Você não tem acesso a este Voluntário.');
    }
    return volunteer;
  }

  async update(id: number, dto: UpdateVolunteerDto, user: AuthUser) {
    const current = await this.findOne(id, user);
    const { pastoralGroupId, ...rest } = dto;

    const moveTo =
      pastoralGroupId !== undefined &&
      pastoralGroupId !== current.pastoralGroupId
        ? pastoralGroupId
        : undefined;

    if (moveTo !== undefined) {
      if (this.isCoordinator(user)) {
        throw new ForbiddenException(
          'Você não pode mover um Voluntário para outra Pastoral (RN006).',
        );
      }
      await this.assertPastoralExists(moveTo);

      const upcoming = (await this.findAssignments(id)).filter(
        (a) => a.isFuture,
      );
      if (upcoming.length > 0) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          message: `Não é possível mudar de Pastoral: o Voluntário está em ${upcoming.length} escala(s) futura(s). Remova-o dessas escalas antes.`,
          assignments: upcoming,
        });
      }
    }

    return this.prismaService.volunteer.update({
      where: { id },
      data: {
        ...rest,
        ...(moveTo !== undefined && {
          pastoralGroup: { connect: { id: moveTo } },
        }),
      },
      include: volunteerInclude,
    });
  }

  async remove(id: number, confirm: boolean, user: AuthUser) {
    await this.findOne(id, user);

    const assignments = await this.findAssignments(id);
    if (assignments.length > 0 && !confirm) {
      const upcoming = assignments.filter((a) => a.isFuture).length;
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        requiresConfirmation: true,
        message: `Este Voluntário tem ${assignments.length} atribuição(ões) em escalas (${upcoming} futura(s)). Confirme para removê-las junto com o cadastro.`,
        assignments,
      });
    }

    // Atômico: ou apaga atribuições + voluntário, ou nada.
    return this.prismaService.$transaction(async (tx) => {
      await tx.scheduleAssignment.deleteMany({ where: { volunteerId: id } });
      return tx.volunteer.delete({ where: { id } });
    });
  }
}
