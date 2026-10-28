// src/masses/masses.controller.ts
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
import { MassesService } from './masses.service';
import { CreateMassDto } from './dto/create-mass.dto';
import { UpdateMassDto } from './dto/update-mass.dto';
import { LinkPastoralGroupsDto } from './dto/link-pastoral-groups.dto';
import { MassQueryDto } from './dto/mass-query.dto';
import { RemoveMassQueryDto } from './dto/remove-mass-query.dto';
import { DateRangeQueryDto } from '../common/dto/date-range-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';

// Default da classe: só Admin Geral e Secretaria. Leituras públicas declaram @Public().
@ApiBearerAuth()
@Roles('Admin Geral', 'Secretaria')
@Controller('masses')
export class MassesController {
  constructor(private readonly massesService: MassesService) {}

  @Auditable('Mass')
  @Post()
  create(@Body() dto: CreateMassDto) {
    return this.massesService.create(dto);
  }

  @Public()
  @Get()
  findAll(@Query() query: MassQueryDto) {
    return this.massesService.findAll(query);
  }

  // Precisa vir ANTES de ':id'.
  @Get('without-pastoral')
  findWithoutPastoral(@Query() query: DateRangeQueryDto) {
    return this.massesService.findWithoutPastoral(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.massesService.findOne(id);
  }

  @Auditable('Mass')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMassDto) {
    return this.massesService.update(id, dto);
  }

  @Auditable('Mass')
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: RemoveMassQueryDto,
  ) {
    return this.massesService.remove(id, query.confirm ?? false);
  }

  /** @deprecated Use PATCH /masses/:id com pastoralGroupIds. Sai junto com a migração Modais → Páginas (Bloco 9). */
  @Auditable('Mass', { action: 'UPDATE' })
  @Post(':id/pastoral-groups')
  linkPastoralGroups(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LinkPastoralGroupsDto,
  ) {
    return this.massesService.linkPastoralGroups(id, dto);
  }
}
