// src/attendance-confirmations/attendance-confirmations.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AttendanceConfirmationsService } from './attendance-confirmations.service';
import { CreateAttendanceConfirmationDto } from './dto/create-attendance-confirmation.dto';
import { FindAttendanceConfirmationsQueryDto } from './dto/find-attendance-confirmations-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

// ATENÇÃO LGPD: nenhuma rota daqui usa @Auditable de propósito. O AuditInterceptor copiaria
// nome/contato para logs_auditoria (dados_anteriores/novos), e a exclusão a pedido do titular
// (DELETE) deixaria o dado pessoal vivo no log.
@ApiBearerAuth()
@Controller('attendance-confirmations')
export class AttendanceConfirmationsController {
  constructor(
    private readonly attendanceConfirmationsService: AttendanceConfirmationsService,
  ) {}

  // RF012 - Garantir Presença, sem login. RNF017: 5 req/min por IP (req.ip; ver TRUST_PROXY_HOPS).
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  create(@Body() dto: CreateAttendanceConfirmationDto, @Ip() ip: string) {
    return this.attendanceConfirmationsService.create(dto, ip);
  }

  @Roles('Admin Geral', 'Secretaria') // UC036 (Coordenador de Pastoral -> 403)
  @Get()
  findAll(@Query() query: FindAttendanceConfirmationsQueryDto) {
    return this.attendanceConfirmationsService.findAll(query);
  }

  @Roles('Admin Geral', 'Secretaria')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceConfirmationsService.findOne(id);
  }

  @Roles('Admin Geral', 'Secretaria') // exclusão a pedido do titular (LGPD)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceConfirmationsService.remove(id);
  }
}
