// src/attendance-confirmations/attendance-confirmations.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { CreateAttendanceConfirmationDto } from './dto/create-attendance-confirmation.dto';
import { FindAttendanceConfirmationsQueryDto } from './dto/find-attendance-confirmations-query.dto';

// RN012: informativo, NÃO reserva lugar. A resposta não ecoa dados da pessoa (LGPD).
export const PRESENCE_MESSAGE =
  'Recebemos o seu interesse em participar. Esta confirmação é apenas um registro informativo e não reserva lugar.';

// Evento sem endDate é considerado encerrado 24h após o início (não recusar quem confirma no próprio dia).
const NO_END_GRACE_MS = 24 * 60 * 60 * 1000;

// Admin: sem ipAddress (dado técnico de rate limit, não precisa circular).
const CONFIRMATION_ADMIN_SELECT = {
  id: true,
  eventId: true,
  name: true,
  contact: true,
  createdAt: true,
} satisfies Prisma.AttendanceConfirmationSelect;

@Injectable()
export class AttendanceConfirmationsService {
  constructor(private readonly prismaService: PrismaService) {}

  /** RF012/UC035. Rota pública: valida estado do evento, é idempotente e não ecoa dados. */
  async create(dto: CreateAttendanceConfirmationDto, ip?: string) {
    const event = await this.prismaService.event.findUnique({
      where: { id: dto.eventId },
      select: { id: true, status: true, startDate: true, endDate: true },
    });
    if (!event) throw new NotFoundException('Evento não encontrado.');
    if (event.status === 'CANCELLED') {
      throw new ConflictException(
        'Este evento foi cancelado e não recebe confirmações.',
      );
    }
    const endsAt =
      event.endDate ?? new Date(event.startDate.getTime() + NO_END_GRACE_MS);
    if (endsAt.getTime() < Date.now()) {
      throw new UnprocessableEntityException('Este evento já foi encerrado.');
    }

    try {
      await this.prismaService.attendanceConfirmation.create({
        data: {
          eventId: dto.eventId,
          name: dto.name,
          contact: dto.contact,
          ipAddress: ip ? ip.slice(0, 45) : null,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // UNIQUE (eventId, contact): repetição = mesma resposta de sucesso (não revela quem já confirmou).
        if (error.code === 'P2002') return { message: PRESENCE_MESSAGE };
        // Evento removido entre a checagem e o insert.
        if (error.code === 'P2003')
          throw new NotFoundException('Evento não encontrado.');
      }
      throw error;
    }
    return { message: PRESENCE_MESSAGE };
  }

  /** UC036: lista paginada de UM evento (eventId obrigatório). */
  async findAll(query: FindAttendanceConfirmationsQueryDto) {
    const { eventId, page = 1, limit = 10, search, order = 'desc' } = query;

    const event = await this.prismaService.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true },
    });
    if (!event) throw new NotFoundException('Evento não encontrado.');

    const where: Prisma.AttendanceConfirmationWhereInput = {
      eventId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { contact: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prismaService.attendanceConfirmation.findMany({
        where,
        orderBy: { createdAt: order },
        skip: (page - 1) * limit,
        take: limit,
        select: CONFIRMATION_ADMIN_SELECT,
      }),
      this.prismaService.attendanceConfirmation.count({ where }),
    ]);

    return {
      event,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const row = await this.prismaService.attendanceConfirmation.findUnique({
      where: { id },
      select: CONFIRMATION_ADMIN_SELECT,
    });
    if (!row)
      throw new NotFoundException('Confirmação de presença não encontrada.');
    return row;
  }

  /** LGPD (RNF007): exclusão do dado pessoal a pedido. */
  async remove(id: string) {
    await this.findOne(id);
    await this.prismaService.attendanceConfirmation.delete({ where: { id } });
    return { id };
  }
}
