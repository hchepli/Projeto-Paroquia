// src/schedule-assignment/schedule-assignment.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { ROLE_NAMES } from '../common/constrants/role-names.constants';
import { CreateScheduleAssignmentDto } from './dto/create-schedule-assignment.dto';
import { UpdateScheduleAssignmentDto } from './dto/update-schedule-assignment.dto';

const DUPLICATE = 'Esse voluntário já está atribuído a essa função nesta escala.';

@Injectable()
export class ScheduleAssignmentService {
  constructor(private readonly prismaService: PrismaService) {}

  private canAccess(user: AuthUser, schedulePastoralGroupId: number | null) {
    if (user.roleName !== ROLE_NAMES.COORDENADOR) return true;
    return user.pastoralGroupId != null && user.pastoralGroupId === schedulePastoralGroupId;
  }

  private async loadSchedule(scheduleId: string, user: AuthUser) {
    const schedule = await this.prismaService.schedule.findUnique({
      where: { id: scheduleId },
      select: { id: true, pastoralGroupId: true },
    });
    if (!schedule) throw new NotFoundException('Escala não encontrada');
    if (!this.canAccess(user, schedule.pastoralGroupId)) {
      throw new ForbiddenException('Você não tem acesso a esta escala.');
    }
    return schedule;
  }

  // Mesma regra do SchedulesService.create: voluntário da pastoral da escala.
  // Escala legada sem pastoral fica sem restrição.
  private async assertVolunteerFits(volunteerId: number, schedulePastoralGroupId: number | null) {
    const volunteer = await this.prismaService.volunteer.findUnique({
      where: { id: volunteerId },
      select: { id: true, pastoralGroupId: true },
    });
    if (!volunteer) throw new NotFoundException('Voluntário não encontrado');
    if (schedulePastoralGroupId !== null && volunteer.pastoralGroupId !== schedulePastoralGroupId) {
      throw new BadRequestException('O Voluntário deve pertencer à Pastoral da escala.');
    }
  }

  private async loadAssignment(id: number, user: AuthUser) {
    const assignment = await this.prismaService.scheduleAssignment.findUnique({
      where: { id },
      include: { schedule: { select: { pastoralGroupId: true } } },
    });
    if (!assignment) throw new NotFoundException('Atribuição não encontrada');
    if (!this.canAccess(user, assignment.schedule.pastoralGroupId)) {
      throw new ForbiddenException('Você não tem acesso a esta atribuição.');
    }
    return assignment;
  }

  async create(dto: CreateScheduleAssignmentDto, user: AuthUser) {
    const schedule = await this.loadSchedule(dto.scheduleId, user);
    await this.assertVolunteerFits(dto.volunteerId, schedule.pastoralGroupId);

    try {
      return await this.prismaService.scheduleAssignment.create({ data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(DUPLICATE);
      }
      throw error;
    }
  }

  async findAll(user: AuthUser) {
    if (user.roleName === ROLE_NAMES.COORDENADOR) {
      if (user.pastoralGroupId == null) return [];
      return this.prismaService.scheduleAssignment.findMany({
        where: { schedule: { pastoralGroupId: user.pastoralGroupId } },
      });
    }
    return this.prismaService.scheduleAssignment.findMany();
  }

  findOne(id: number, user: AuthUser) {
    return this.loadAssignment(id, user);
  }

  async update(id: number, dto: UpdateScheduleAssignmentDto, user: AuthUser) {
    const current = await this.loadAssignment(id, user);

    const scheduleChanged = dto.scheduleId !== undefined && dto.scheduleId !== current.scheduleId;
    const volunteerChanged = dto.volunteerId !== undefined && dto.volunteerId !== current.volunteerId;

    let schedulePastoralGroupId = current.schedule.pastoralGroupId;
    if (scheduleChanged) {
      schedulePastoralGroupId = (await this.loadSchedule(dto.scheduleId!, user)).pastoralGroupId;
    }
    if (scheduleChanged || volunteerChanged) {
      await this.assertVolunteerFits(dto.volunteerId ?? current.volunteerId, schedulePastoralGroupId);
    }

    try {
      return await this.prismaService.scheduleAssignment.update({ where: { id }, data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(DUPLICATE);
      }
      throw error;
    }
  }

  async remove(id: number, user: AuthUser) {
    await this.loadAssignment(id, user);
    return this.prismaService.scheduleAssignment.delete({ where: { id } });
  }
}