import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Req,
  Query,
} from '@nestjs/common';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AdminAnnouncementQueryDto } from './dto/admin-announcement-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';

@ApiBearerAuth()
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Auditable('Announcement')
  @Roles('Admin Geral', 'Secretaria')
  @Post()
  create(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @Req() req: RequestWithUser,
  ) {
    return this.announcementsService.create(
      createAnnouncementDto,
      req.user.userId,
    );
  }

  // ---- Rotas estáticas ANTES de ':id' (senão viram id) ----

  // Admin: todos os status, filtro opcional ?status=DRAFT|PUBLISHED
  // (antes era /draft, nome enganoso)
  @Roles('Admin Geral', 'Secretaria')
  @Get('admin')
  findAllAdmin(@Query() query: AdminAnnouncementQueryDto) {
    return this.announcementsService.findAllAdmin(query);
  }

  @Roles('Admin Geral', 'Secretaria')
  @Get('admin/stats')
  getStats() {
    return this.announcementsService.getStats();
  }

  // Pública - detalhe por slug (UC026, RNF014)
  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.announcementsService.findBySlug(slug);
  }

  // Pública - só PUBLISHED
  @Public()
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.announcementsService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.findOne(id);
  }

  @Auditable('Announcement')
  @Roles('Admin Geral', 'Secretaria')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(id, updateAnnouncementDto);
  }

  @Auditable('Announcement')
  @Roles('Admin Geral', 'Secretaria')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.remove(id);
  }
}