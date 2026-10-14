import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MassTemplatesService } from '../mass-templates/mass-templates.service';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { CalendarItemDto } from './dto/calendar-item.dto';

@Injectable()
export class CalendarService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly massTemplatesService: MassTemplatesService,
  ) {}

  async findAll(query: CalendarQueryDto): Promise<CalendarItemDto[]> {
    const start = new Date(query.start);
    const end = new Date(query.end);

    // Garante que as recorrências (Bloco 5) já estão materializadas como
    // Mass real antes de consultar o período — sem cron, sob demanda.
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