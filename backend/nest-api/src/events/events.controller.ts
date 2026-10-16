// src/events/events.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { LinkPastoralGroupsDto } from './dto/link-pastoral-groups.dto';
import { FindAdminEventsQueryDto, FindEventsQueryDto } from './dto/find-events-query.dto';
import { RemoveEventQueryDto } from './dto/remove-event-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';

const READ_ROLES = ['Admin Geral', 'Secretaria', 'Coordenador de Pastoral'];
// UC036: só estes veem contagem/lista de confirmações
const canSeeAttendance = (user?: { roleName?: string }) =>
  user?.roleName === 'Admin Geral' || user?.roleName === 'Secretaria';

// Default da classe: só Admin Geral e Secretaria. Leituras declaram @Public() ou @Roles(READ_ROLES).
@ApiBearerAuth()
@Roles('Admin Geral', 'Secretaria')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Auditable('Event')
  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  // Público: só ACTIVE. (includeAll saiu: em rota @Public o JwtAuthGuard não popula req.user.)
  @Public()
  @Get()
  findAll(@Query() query: FindEventsQueryDto) {
    return this.eventsService.findAllPublic(query);
  }

  // Rotas fixas ('admin', 'slug/...') SEMPRE antes de ':id'.
  @Roles(...READ_ROLES)
  @Get('admin')
  findAllAdmin(@Query() query: FindAdminEventsQueryDto, @Req() req: { user?: { roleName?: string } }) {
    return this.eventsService.findAllAdmin(query, canSeeAttendance(req.user));
  }

  @Roles(...READ_ROLES)
  @Get('admin/:id')
  findOneAdmin(@Param('id', ParseIntPipe) id: number, @Req() req: { user?: { roleName?: string } }) {
    return this.eventsService.findOneAdmin(id, canSeeAttendance(req.user));
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.eventsService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOnePublic(id);
  }

  @Auditable('Event')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Auditable('Event')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Query() query: RemoveEventQueryDto) {
    return this.eventsService.remove(id, query.confirm ?? false);
  }

  /** @deprecated Use PATCH /events/:id com pastoralGroupIds. Sai junto com a migração Modais → Páginas (Bloco 9). */
  @Auditable('Event', { action: 'UPDATE' })
  @Post(':id/pastoral-groups')
  linkPastoralGroups(@Param('id', ParseIntPipe) id: number, @Body() dto: LinkPastoralGroupsDto) {
    return this.eventsService.linkPastoralGroups(id, dto);
  }
}
