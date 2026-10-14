// src/schedule-assignment/schedule-assignment.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ScheduleAssignmentService } from './schedule-assignment.service';
import { CreateScheduleAssignmentDto } from './dto/create-schedule-assignment.dto';
import { UpdateScheduleAssignmentDto } from './dto/update-schedule-assignment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { ROLE_NAMES } from '../common/constrants/role-names.constants';

@ApiBearerAuth()
@Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.SECRETARIA, ROLE_NAMES.COORDENADOR)
@Controller('schedule-assignment')
export class ScheduleAssignmentController {
  constructor(private readonly scheduleAssignmentService: ScheduleAssignmentService) {}

  @Post()
  create(@Body() dto: CreateScheduleAssignmentDto, @CurrentUser() user: AuthUser) {
    return this.scheduleAssignmentService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.scheduleAssignmentService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.scheduleAssignmentService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleAssignmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.scheduleAssignmentService.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.scheduleAssignmentService.remove(id, user);
  }
}