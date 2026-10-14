import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { LinkPastoralGroupsDto } from './dto/link-pastoral-groups.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';
import { FindEventsQueryDto } from './dto/find-events-query.dto';

@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }


  @Auditable('Event')
  @Roles('Admin Geral', 'Secretaria')
  @Post()
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

@Public()
@Get()
findAll(@Query() query: FindEventsQueryDto) {
  return this.eventsService.findAll(query);
}

  @Public()
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.eventsService.findOne(+id);
  }

  @Auditable('Event')
  @Roles('Admin Geral', 'Secretaria')
  @Patch(':id')
  update(@Param('id') id: number, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(+id, updateEventDto);
  }

  @Auditable('Event')
  @Roles('Admin Geral', 'Secretaria')
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.eventsService.remove(+id);
  }

  // RN017 (proposta): vincula Pastorais participantes deste Evento
  @Roles('Admin Geral', 'Secretaria')
  @Post(':id/pastoral-groups')
  linkPastoralGroups(@Param('id') id: number, @Body() dto: LinkPastoralGroupsDto) {
    return this.eventsService.linkPastoralGroups(+id, dto);
  }
}