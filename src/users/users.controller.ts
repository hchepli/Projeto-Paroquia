// src/users/users.controller.ts
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';
import { ROLE_NAMES } from '../common/constrants/role-names.constants';

@ApiBearerAuth()
@Roles(ROLE_NAMES.ADMIN) // nível da classe: toda rota nova nasce protegida (RN004)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Auditable('User')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Auditable('User')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Auditable('User')
  @Patch(':id/password')
  changePassword(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(id, dto.newPassword);
  }

  @Auditable('User')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser) {
    return this.usersService.remove(id, actor.userId);
  }
}