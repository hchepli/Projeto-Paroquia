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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { AnnouncementsService } from './announcements.service';
import type { UploadedFileLike } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AdminAnnouncementQueryDto } from './dto/admin-announcement-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';

// RNF008 - mesmos valores do photos.controller (1ª barreira; o conteúdo real
// é validado no StorageService).
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const imageUpload = FileInterceptor('image', {
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          `Tipo de arquivo não permitido: ${file.mimetype}. Use JPEG, PNG ou WEBP.`,
        ),
        false,
      );
    }
    callback(null, true);
  },
});

@ApiBearerAuth()
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Auditable('Announcement')
  @Roles('Admin Geral', 'Secretaria')
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(imageUpload)
  create(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @Req() req: RequestWithUser,
    @UploadedFile() file?: UploadedFileLike,
  ) {
    return this.announcementsService.create(
      createAnnouncementDto,
      req.user.userId,
      file,
    );
  }

  // ---- Rotas estáticas ANTES de ':id' (senão viram id) ----

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

  // NOVO: detalhe admin por id (aceita rascunho)
  @Roles('Admin Geral', 'Secretaria')
  @Get('admin/:id')
  findOneAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.findOneAdmin(id);
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.announcementsService.findBySlug(slug);
  }

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

  // Aceita JSON (ex.: só trocar status) ou multipart (com imagem nova).
  @Auditable('Announcement')
  @Roles('Admin Geral', 'Secretaria')
  @Patch(':id')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(imageUpload)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
    @UploadedFile() file?: UploadedFileLike,
  ) {
    return this.announcementsService.update(id, updateAnnouncementDto, file);
  }

  @Auditable('Announcement')
  @Roles('Admin Geral', 'Secretaria')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.remove(id);
  }
}