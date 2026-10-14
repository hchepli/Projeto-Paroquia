import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Req, Query, Res } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleQueryDto } from './dto/schedule-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { buildSchedulesCsv } from './utils/schedules-csv.util';
import { buildSchedulesPdf } from './utils/schedules-pdf.util';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';
import { PendingScheduleQueryDto } from './dto/pending-schedule-query.dto';

@ApiBearerAuth()
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) { }

  @Auditable('Schedule')
  @Roles('Admin Geral', 'Secretaria', 'Coordenador de Pastoral')
  @Post()
  create(@Body() createScheduleDto: CreateScheduleDto, @Req() req: RequestWithUser) {
    return this.schedulesService.create(createScheduleDto, req.user);
  }

  @Roles('Admin Geral', 'Secretaria', 'Coordenador de Pastoral')
  @Get()
  findAll(@Req() req: RequestWithUser, @Query() query: ScheduleQueryDto) {
    return this.schedulesService.findAll(req.user, query);
  }

  @Roles('Admin Geral', 'Secretaria', 'Coordenador de Pastoral')
  @Get('summary')
  getSummary(@Req() req: RequestWithUser, @Query() query: ScheduleQueryDto) {
    return this.schedulesService.findAllForExport(req.user, query);
  }

  @Roles('Admin Geral', 'Secretaria', 'Coordenador de Pastoral')
  @Get('report/export')
  async exportReport(
    @Req() req: RequestWithUser,
    @Query() query: ScheduleQueryDto,
    @Res() res: Response,
  ) {
    if (query.format !== 'csv' && query.format !== 'pdf') {
      return res.status(400).json({
        message: 'Formato inválido. Apenas "csv" ou "pdf" são aceitos.',
      });
    }

    const schedules = await this.schedulesService.findAllForExport(req.user, query);

    if (query.format === 'csv') {
      const csv = buildSchedulesCsv(schedules);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio-escalas.csv"');
      return res.send(csv);
    }

    const doc = buildSchedulesPdf(schedules, {
      startDate: query.startDate,
      endDate: query.endDate,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-escalas.pdf"');
    doc.pipe(res);
    doc.end();
  }

@Roles('Admin Geral', 'Secretaria', 'Coordenador de Pastoral')
@Get('pending')
findPending(@Query() query: PendingScheduleQueryDto, @Req() req: RequestWithUser) {
  return this.schedulesService.findPending(query.start, query.end, req.user, query.pastoralGroupId);
}

@Roles('Admin Geral', 'Secretaria', 'Coordenador de Pastoral')
@Get('coverage')
findCoverage(@Query() query: PendingScheduleQueryDto, @Req() req: RequestWithUser) {
  return this.schedulesService.findCoverage(query.start, query.end, req.user, query.pastoralGroupId);
}
  
  @Roles('Admin Geral', 'Secretaria', 'Coordenador de Pastoral')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.schedulesService.findOne(id, req.user);
  }

  @Auditable('Schedule')
  @Roles('Admin Geral', 'Secretaria', 'Coordenador de Pastoral')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @Req() req: RequestWithUser,
  ) {
    return this.schedulesService.update(id, updateScheduleDto, req.user);
  }

  @Auditable('Schedule')
  @Roles('Admin Geral', 'Secretaria', 'Coordenador de Pastoral')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.schedulesService.remove(id, req.user);
  }
}