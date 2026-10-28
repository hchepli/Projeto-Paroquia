import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MassTemplatesService } from '../mass-templates/mass-templates.service';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { CalendarItemDto } from './dto/calendar-item.dto';
import { assertValidRange } from '../common/utils/date-range.util';

const MAX_RANGE_DAYS = 366;

@Injectable()
export class CalendarService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly massTemplatesService: MassTemplatesService,
  ) {}

  async findAll(query: CalendarQueryDto): Promise<CalendarItemDto[]> {
    const start = new Date(query.start);
    const end = new Date(query.end);
    assertValidRange(start, end, MAX_RANGE_DAYS); // 400 se invertido ou > 366 dias

    await this.massTemplatesService.ensureGenerated(end);

    const [masses, events] = await Promise.all([
      this.prismaService.mass.findMany({
        where: { dateTime: { gte: start, lte: end } },
        select: { id: true, title: true, dateTime: true },
      }),
      this.prismaService.event.findMany({
        where: { startDate: { gte: start, lte: end }, status: 'ACTIVE' },
        select: { id: true, name: true, startDate: true },
      }),
    ]);

    const massItems: CalendarItemDto[] = masses.map((mass) => ({
      id: mass.id,
      title: mass.title,
      date: mass.dateTime.toISOString(),
      type: 'mass',
    }));

    const eventItems: CalendarItemDto[] = events.map((event) => ({
      id: event.id,
      title: event.name,
      date: event.startDate.toISOString(),
      type: 'event',
    }));

    return [...massItems, ...eventItems].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }
}
