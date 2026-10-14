// src/pastoral-groups/pastoral-groups.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PastoralGroupsService } from './pastoral-groups.service';
import { CreatePastoralGroupDto } from './dto/create-pastoral-group.dto';
import { UpdatePastoralGroupDto } from './dto/update-pastoral-group.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { ROLE_NAMES } from '../common/constrants/role-names.constants';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';

const { ADMIN, SECRETARIA, COORDENADOR } = ROLE_NAMES;

// Sem @Roles na classe: as rotas públicas (UC034) cairiam em 403 no RolesGuard.
@ApiBearerAuth()
@Controller('pastoral-groups')
export class PastoralGroupsController {
  constructor(private readonly pastoralGroupsService: PastoralGroupsService) {}

  @Auditable('PastoralGroup')
  @Roles(ADMIN)
  @Post()
  create(@Body() dto: CreatePastoralGroupDto) {
    return this.pastoralGroupsService.create(dto);
  }

  // ---- Público (Visitante): só campos públicos ----
  @Public()
  @Get()
  findAllPublic() {
    return this.pastoralGroupsService.findAllPublic();
  }

  // ---- Interno (admin): campos completos. DECLARAR ANTES de ':id' ----
  @Roles(ADMIN, SECRETARIA, COORDENADOR)
  @Get('internal')
  findAllInternal() {
    return this.pastoralGroupsService.findAllInternal();
  }

  @Roles(ADMIN, SECRETARIA, COORDENADOR)
  @Get('internal/:id')
  findOneInternal(@Param('id', ParseIntPipe) id: number) {
    return this.pastoralGroupsService.findOneInternal(id);
  }

  @Public()
  @Get(':id')
  findOnePublic(@Param('id', ParseIntPipe) id: number) {
    return this.pastoralGroupsService.findOnePublic(id);
  }

  @Auditable('PastoralGroup')
  @Roles(ADMIN, COORDENADOR)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePastoralGroupDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pastoralGroupsService.update(id, dto, user);
  }

  @Auditable('PastoralGroup')
  @Roles(ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pastoralGroupsService.remove(id);
  }
}