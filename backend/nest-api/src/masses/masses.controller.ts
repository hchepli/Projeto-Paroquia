import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MassesService } from './masses.service';
import { CreateMassDto } from './dto/create-mass.dto';
import { UpdateMassDto } from './dto/update-mass.dto';
import { LinkPastoralGroupsDto } from './dto/link-pastoral-groups.dto';
import { MassesWithoutPastoralQueryDto } from './dto/masses-without-pastoral-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { MassQueryDto } from './dto/mass-query.dto';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';

@ApiBearerAuth()
@Controller('masses')
export class MassesController {
  constructor(private readonly massesService: MassesService) {}

  @Auditable('Mass')
  @Roles('Admin Geral', 'Secretaria')
  @Post()
  create(@Body() createMassDto: CreateMassDto) {
    return this.massesService.create(createMassDto);
  }

  @Public()
  @Get()
  findAll(@Query() query: MassQueryDto) {
    return this.massesService.findAll(query);
  }

  // Card "Missas sem Pastoral" do Painel Admin (Bloco 8). Precisa vir ANTES
  // de @Get(':id') — senão o Nest casa "without-pastoral" como se fosse um
  // :id e quebra o endpoint. Restrito aos mesmos cargos que veem o Painel
  // (dado agregado de gestão, não é conteúdo público).
  @Roles('Admin Geral', 'Secretaria')
  @Get('without-pastoral')
  findWithoutPastoral(@Query() query: MassesWithoutPastoralQueryDto) {
    return this.massesService.findWithoutPastoral(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.massesService.findOne(+id);
  }

  @Auditable('Mass')
  @Roles('Admin Geral', 'Secretaria')
  @Patch(':id')
  update(@Param('id') id: number, @Body() updateMassDto: UpdateMassDto) {
    return this.massesService.update(+id, updateMassDto);
  }

  @Auditable('Mass')
  @Roles('Admin Geral', 'Secretaria')
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.massesService.remove(+id);
  }

  // RN017 (proposta): vincula Pastorais participantes desta Missa
  @Roles('Admin Geral', 'Secretaria')
  @Post(':id/pastoral-groups')
  linkPastoralGroups(@Param('id') id: number, @Body() dto: LinkPastoralGroupsDto) {
    return this.massesService.linkPastoralGroups(+id, dto);
  }
}
