import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { Roles } from '../auth/decorators/roles.decorator';

// Somente leitura. Quem grava é o AuditInterceptor (não existe POST: impede forjar log).
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  // Lista resumida e paginada (sem JSONs).
  @Roles('Admin Geral', 'Secretaria')
  @Get()
  findAll(@Query() query: QueryAuditLogsDto) {
    return this.auditLogsService.findAll(query);
  }

  // Detalhe com dados_anteriores/dados_novos: só Admin Geral.
  @Roles('Admin Geral')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditLogsService.findOne(id);
  }
}