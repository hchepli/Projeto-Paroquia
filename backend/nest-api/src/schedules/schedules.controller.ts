import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { ScheduleQueryDto } from './dto/schedule-query.dto';
import { CoverageQueryDto } from './dto/coverage-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { ROLE_NAMES } from '../common/constrants/role-names.constants';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';
import { buildSchedulesCsv } from './utils/schedules-csv.util';
import { buildSchedulesPdf } from './utils/schedules-pdf.util';

@ApiBearerAuth()
@Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.SECRETARIA, ROLE_NAMES.COORDENADOR)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Auditable('Schedule')
  @Post()
  create(@Body() dto: CreateScheduleDto, @CurrentUser() user: AuthUser) {
    return this.schedulesService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: ScheduleQueryDto) {
    return this.schedulesService.findAll(user, query);
  }

  /** LEGADO (Painel): remover quando o grep confirmar que ninguém usa. */
  @Get('summary')
  getSummary(@CurrentUser() user: AuthUser, @Query() query: ScheduleQueryDto) {
    return this.schedulesService.findAllForExport(user, query);
  }

  @Get('report/export')
  async exportReport(@CurrentUser() user: AuthUser, @Query() query: ScheduleQueryDto, @Res() res: Response) {
    if (query.format !== 'csv' && query.format !== 'pdf') {
      throw new BadRequestException('Formato inválido. Apenas "csv" ou "pdf" são aceitos.');
    }
    const schedules = await this.schedulesService.findAllForExport(user, query);

    if (query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio-escalas.csv"');
      return res.send(buildSchedulesCsv(schedules));
    }

    const doc = buildSchedulesPdf(schedules, { startDate: query.startDate, endDate: query.endDate });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-escalas.pdf"');
    doc.pipe(res);
    doc.end();
  }

  /** LEGADO: derivado de /coverage. Remover quando o grep confirmar que ninguém usa. */
  @Get('pending')
  findPending(@Query() query: CoverageQueryDto, @CurrentUser() user: AuthUser) {
    return this.schedulesService.findPending(query, user);
  }

  @Get('coverage')
  findCoverage(@Query() query: CoverageQueryDto, @CurrentUser() user: AuthUser) {
    return this.schedulesService.findCoverage(query, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.schedulesService.findOne(id, user);
  }

  // Sem PATCH: a escala só tem vínculos imutáveis; atribuições têm endpoints próprios (/schedule-assignment).

  @Auditable('Schedule')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.schedulesService.remove(id, user);
  }
}