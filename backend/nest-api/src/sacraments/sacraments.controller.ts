import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SacramentsService } from './sacraments.service';
import { CreateSacramentDto } from './dto/create-sacrament.dto';
import { UpdateSacramentDto } from './dto/update-sacrament.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';

@ApiBearerAuth()
@Controller('sacraments')
export class SacramentsController {
  constructor(private readonly sacramentsService: SacramentsService) {}

  @Auditable('Sacrament')
  @Roles('Admin Geral', 'Secretaria')
  @Post()
  create(@Body() createSacramentDto: CreateSacramentDto) {
    return this.sacramentsService.create(createSacramentDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.sacramentsService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.sacramentsService.findOne(+id);
  }

  @Auditable('Sacrament')
  @Roles('Admin Geral', 'Secretaria')
  @Patch(':id')
  update(@Param('id') id: number, @Body() updateSacramentDto: UpdateSacramentDto) {
    return this.sacramentsService.update(+id, updateSacramentDto);
  }

  @Auditable('Sacrament')
  @Roles('Admin Geral', 'Secretaria')
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.sacramentsService.remove(+id);
  }
}