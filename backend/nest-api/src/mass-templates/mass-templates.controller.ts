import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { MassTemplatesService } from './mass-templates.service';
import { CreateMassTemplateDto } from './dto/create-mass-template.dto';
import { UpdateMassTemplateDto } from './dto/update-mass-template.dto';
// ASSUMIDO — confirmar nome real do guard/decorator de cargo usado no projeto
import { RolesGuard } from '../auth/guards/roles.guards';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(RolesGuard)
@Roles('Admin Geral', 'Secretaria')
@Controller('mass-templates')
export class MassTemplatesController {
  constructor(private readonly massTemplatesService: MassTemplatesService) {}

  @Post()
  create(@Body() dto: CreateMassTemplateDto) {
    return this.massTemplatesService.create(dto);
  }

  @Get()
  findAll() {
    return this.massTemplatesService.findAll();
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMassTemplateDto) {
    return this.massTemplatesService.update(id, dto);
  }
}