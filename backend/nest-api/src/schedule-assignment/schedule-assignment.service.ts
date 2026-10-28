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
import { CreateScheduleAssignmentDto } from './dto/create-schedule-assignment.dto';
import { UpdateScheduleAssignmentDto } from './dto/update-schedule-assignment.dto';
import {
  canAccessPastoral,
  normalizeRole,
} from '../schedules/utils/schedule-rules.util';
import {
  assertVolunteersBelong,
  assertWritable,
  findVolunteerConflicts,
  loadSource,
  lockSchedule,
} from '../schedules/utils/schedule-db.util';

const DUPLICATE =
  'Esse voluntário já está atribuído a essa função nesta escala.';
type Tx = Prisma.TransactionClient;

@Injectable()
export class ScheduleAssignmentService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Trava a Escala (FOR UPDATE), confere escopo e estado (cancelado/realizado).
   * O mesmo lock é usado em SchedulesService.remove: edição e remoção da escala se serializam.
   */
  private async lockAndCheck(tx: Tx, scheduleId: string, user: AuthUser) {
    await lockSchedule(tx, scheduleId); // 404
    const schedule = await tx.schedule.findUniqueOrThrow({
      where: { id: scheduleId },
      select: { id: true, massId: true, eventId: true, pastoralGroupId: true },
    });
    if (!canAccessPastoral(user, schedule.pastoralGroupId)) {
      throw new ForbiddenException('Você não tem acesso a esta escala.');
    }
    const source = await loadSource(tx, schedule);
    assertWritable(source, user);
    return { schedule, source };
  }

  private translate(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(DUPLICATE);
    }
    return error;
  }

  async create(dto: CreateScheduleAssignmentDto, user: AuthUser) {
    const role = normalizeRole(dto.role);
    try {
      const { assignment, source } = await this.prismaService.$transaction(
        async (tx) => {
          const { schedule, source } = await this.lockAndCheck(
            tx,
            dto.scheduleId,
            user,
          );
          await assertVolunteersBelong(
            tx,
            [dto.volunteerId],
            schedule.pastoralGroupId,
          );
          const assignment = await tx.scheduleAssignment.create({
            data: {
              scheduleId: dto.scheduleId,
              volunteerId: dto.volunteerId,
              role,
            },
          });
          return { assignment, source };
        },
      );
      const warnings = await findVolunteerConflicts(
        this.prismaService,
        source,
        [dto.volunteerId],
      );
      return { ...assignment, warnings };
    } catch (error) {
      throw this.translate(error);
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

  async findOne(id: number, user: AuthUser) {
    const assignment = await this.prismaService.scheduleAssignment.findUnique({
      where: { id },
      include: { schedule: { select: { pastoralGroupId: true } } },
    });
    if (!assignment) throw new NotFoundException('Atribuição não encontrada');
    if (!canAccessPastoral(user, assignment.schedule.pastoralGroupId)) {
      throw new ForbiddenException('Você não tem acesso a esta atribuição.');
    }
    return assignment;
  }

  async update(id: number, dto: UpdateScheduleAssignmentDto, user: AuthUser) {
    const pre = await this.prismaService.scheduleAssignment.findUnique({
      where: { id },
      select: { scheduleId: true },
    });
    if (!pre) throw new NotFoundException('Atribuição não encontrada');

    try {
      const { updated, source, volunteerChanged } =
        await this.prismaService.$transaction(async (tx) => {
          const { schedule, source } = await this.lockAndCheck(
            tx,
            pre.scheduleId,
            user,
          );
          const current = await tx.scheduleAssignment.findUnique({
            where: { id },
          }); // pode ter sumido antes do lock
          if (!current)
            throw new NotFoundException('Atribuição não encontrada');

          const volunteerChanged =
            dto.volunteerId !== undefined &&
            dto.volunteerId !== current.volunteerId;
          if (volunteerChanged)
            await assertVolunteersBelong(
              tx,
              [dto.volunteerId!],
              schedule.pastoralGroupId,
            );

          const updated = await tx.scheduleAssignment.update({
            where: { id },
            data: {
              ...(dto.volunteerId !== undefined && {
                volunteerId: dto.volunteerId,
              }),
              ...(dto.role !== undefined && { role: normalizeRole(dto.role) }),
            },
          });
          return { updated, source, volunteerChanged };
        });
      const warnings = volunteerChanged
        ? await findVolunteerConflicts(this.prismaService, source, [
            updated.volunteerId,
          ])
        : [];
      return { ...updated, warnings };
    } catch (error) {
      throw this.translate(error);
    }
  }

  async remove(id: number, user: AuthUser) {
    const pre = await this.prismaService.scheduleAssignment.findUnique({
      where: { id },
      select: { scheduleId: true },
    });
    if (!pre) throw new NotFoundException('Atribuição não encontrada');

    return this.prismaService.$transaction(async (tx) => {
      await this.lockAndCheck(tx, pre.scheduleId, user);
      const current = await tx.scheduleAssignment.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!current) throw new NotFoundException('Atribuição não encontrada');

      // Escala nunca fica vazia (RN: mínimo 1 atribuição). Para esvaziar, remova a escala.
      const count = await tx.scheduleAssignment.count({
        where: { scheduleId: pre.scheduleId },
      });
      if (count <= 1) {
        throw new ConflictException(
          'Uma escala precisa ter ao menos uma atribuição. Para esvaziá-la, remova a escala inteira.',
        );
      }
      return tx.scheduleAssignment.delete({ where: { id } });
    });
  }
}
