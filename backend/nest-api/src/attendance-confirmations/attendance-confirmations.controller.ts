import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AttendanceConfirmationsService } from './attendance-confirmations.service';
import { CreateAttendanceConfirmationDto } from './dto/create-attendance-confirmation.dto';
import { UpdateAttendanceConfirmationDto } from './dto/update-attendance-confirmation.dto';
import { ParseIntPipe } from '@nestjs/common/pipes/parse-int.pipe';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';

@ApiBearerAuth()
@Controller('attendance-confirmations')
export class AttendanceConfirmationsController {
  constructor(private readonly attendanceConfirmationsService: AttendanceConfirmationsService) {}

  @Auditable('Attendance Confirmation')
  @Public() // RF012 - Garantir Presença, sem login
  @Post()
  create(@Body() createAttendanceConfirmationDto: CreateAttendanceConfirmationDto) {
    return this.attendanceConfirmationsService.create(createAttendanceConfirmationDto);
  }

  @Roles('Admin Geral', 'Secretaria') // UC036
  @Get()
  findAll() {
    return this.attendanceConfirmationsService.findAll();
  }

  @Roles('Admin Geral', 'Secretaria')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.attendanceConfirmationsService.findOne(id);
  }

  @Auditable('Attendance Confirmation')
  @Roles('Admin Geral', 'Secretaria')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: string, @Body() updateAttendanceConfirmationDto: UpdateAttendanceConfirmationDto) {
    return this.attendanceConfirmationsService.update(id, updateAttendanceConfirmationDto);
  }

  @Auditable('Attendance Confirmation')
  @Roles('Admin Geral', 'Secretaria')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.attendanceConfirmationsService.remove(id);
  }
}