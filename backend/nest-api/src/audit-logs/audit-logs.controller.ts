import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Roles('Admin Geral')
  @Post()
  create(@Body() createAuditLogDto: CreateAuditLogDto) {
    return this.auditLogsService.create(createAuditLogDto);
  }

  @Roles('Admin Geral', 'Secretaria')
  @Get()
  findAll() {
    return this.auditLogsService.findAll();
  }

  @Roles('Admin Geral', 'Secretaria')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditLogsService.findOne(id);
  }
}