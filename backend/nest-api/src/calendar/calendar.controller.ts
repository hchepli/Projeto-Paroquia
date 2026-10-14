import { Controller, Get, Query } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Public()
  @Get()
  findAll(@Query() query: CalendarQueryDto) {
    return this.calendarService.findAll(query);
  }
}
