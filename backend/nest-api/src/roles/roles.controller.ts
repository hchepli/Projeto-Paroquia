// src/roles/roles.controller.ts
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE_NAMES } from '../common/constrants/role-names.constants';

@ApiBearerAuth()
@Roles(ROLE_NAMES.ADMIN)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @ApiQuery({
    name: 'confirmBase',
    required: false,
    type: Boolean,
    description: 'Confirmação extra para remover cargo base (UC006)',
  })
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('confirmBase', new DefaultValuePipe(false), ParseBoolPipe)
    confirmBase: boolean,
  ) {
    return this.rolesService.remove(id, confirmBase);
  }
}
