import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { LinkPastoralGroupsDto } from './dto/link-pastoral-groups.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Event } from '../../generated/prisma/client';
import { generateSlug } from '../common/utils/slug.util';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { FindEventsQueryDto } from './dto/find-events-query.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prismaService: PrismaService) { }

  async create(createEventDto: CreateEventDto) {
    const { slug, ...rest } = createEventDto;
    const finalSlug = slug ?? generateSlug(rest.name);

    try {
      return await this.prismaService.event.create({
        data: { ...rest, slug: finalSlug },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um evento com esse nome');
      }
      throw error;
    }
  }

  async findAll(query: FindEventsQueryDto): Promise<PaginatedResult<Event>> {
    const { page = 1, limit = 10, search, sortBy, order = 'desc', includeAll } = query;
    const skip = (page - 1) * limit;

    const shouldIncludeAll = includeAll === 'true';

    const where: Prisma.EventWhereInput = {
      ...(!shouldIncludeAll && { status: 'ACTIVE' }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const allowedSortFields = ['startDate', 'name'] as const;
    const finalSortBy = allowedSortFields.includes(sortBy as any) ? sortBy : 'startDate';
    const orderBy = { [finalSortBy as string]: order };

    const [data, total] = await Promise.all([
      this.prismaService.event.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prismaService.event.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const event = await this.prismaService.event.findUnique({
      where: { id },
      include: {
        pastoralGroups: {
          include: { pastoralGroup: true },
        },
      },
    });
    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }
    return event;
  }

  async update(id: number, updateEventDto: UpdateEventDto) {
    await this.findOne(id);
    try {
      return await this.prismaService.event.update({ where: { id }, data: updateEventDto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um evento com esse nome');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prismaService.event.delete({ where: { id } });
  }

  // RN017 (proposta): vincula quais Pastorais participam deste Evento.
  async linkPastoralGroups(id: number, dto: LinkPastoralGroupsDto) {
    await this.findOne(id);

    try {
      return await this.prismaService.$transaction(async (tx) => {
        await tx.eventPastoralGroup.deleteMany({ where: { eventId: id } });

        if (dto.pastoralGroupIds.length > 0) {
          await tx.eventPastoralGroup.createMany({
            data: dto.pastoralGroupIds.map((pastoralGroupId) => ({
              eventId: id,
              pastoralGroupId,
            })),
          });
        }

        return tx.eventPastoralGroup.findMany({
          where: { eventId: id },
          include: { pastoralGroup: true },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new NotFoundException('Uma ou mais Pastorais informadas não existem.');
      }
      throw error;
    }
  }
}