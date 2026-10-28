import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SacramentsService } from './sacraments.service';
import { CreateSacramentDto } from './dto/create-sacrament.dto';
import { UpdateSacramentDto } from './dto/update-sacrament.dto';
import { ReorderSacramentsDto } from './dto/reorder-sacraments.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';

@ApiBearerAuth()
@Controller('sacraments')
export class SacramentsController {
  constructor(private readonly sacramentsService: SacramentsService) {}

  @Auditable('Sacrament')
  @Roles('Admin Geral', 'Secretaria')
  @Post()
  create(@Body() dto: CreateSacramentDto) {
    return this.sacramentsService.create(dto);
  }

  // UC032: público, já ordenado por displayOrder.
  @Public()
  @Get()
  findAll() {
    return this.sacramentsService.findAll();
  }

  // IMPORTANTE: rotas estáticas (slug/..., reorder) vêm ANTES das rotas com :id.
  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.sacramentsService.findBySlug(slug);
  }

  // Reordenação em lote (admin). Sem @Auditable por enquanto: ver nota no relatório.
  @Roles('Admin Geral', 'Secretaria')
  @Patch('reorder')
  reorder(@Body() dto: ReorderSacramentsDto) {
    return this.sacramentsService.reorder(dto.ids);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sacramentsService.findOne(id);
  }

  @Auditable('Sacrament')
  @Roles('Admin Geral', 'Secretaria')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSacramentDto) {
    return this.sacramentsService.update(id, dto);
  }

  @Auditable('Sacrament')
  @Roles('Admin Geral', 'Secretaria')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sacramentsService.remove(id);
  }
}
