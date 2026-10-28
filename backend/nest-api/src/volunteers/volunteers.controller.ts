// src/volunteers/volunteers.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { VolunteersService } from './volunteers.service';
import { CreateVolunteerDto } from './dto/create-volunteer.dto';
import { UpdateVolunteerDto } from './dto/update-volunteer.dto';
import { FindVolunteersQueryDto } from './dto/find-volunteers-query.dto';
import { RemoveVolunteerQueryDto } from './dto/remove-volunteer-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { ROLE_NAMES } from '../common/constrants/role-names.constants';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';

@ApiBearerAuth()
@Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.SECRETARIA, ROLE_NAMES.COORDENADOR)
@Controller('volunteers')
export class VolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Auditable('Volunteer')
  @Post()
  create(@Body() dto: CreateVolunteerDto, @CurrentUser() user: AuthUser) {
    return this.volunteersService.create(dto, user);
  }

  @Get()
  findAll(
    @Query() query: FindVolunteersQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.volunteersService.findAll(user, query);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.volunteersService.findOne(id, user);
  }

  @Auditable('Volunteer')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVolunteerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.volunteersService.update(id, dto, user);
  }

  @Auditable('Volunteer')
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: RemoveVolunteerQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.volunteersService.remove(id, query.confirm === true, user);
  }
}
