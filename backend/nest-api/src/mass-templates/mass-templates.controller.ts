// src/mass-templates/mass-templates.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { MassTemplatesService } from './mass-templates.service';
import { CreateMassTemplateDto } from './dto/create-mass-template.dto';
import { UpdateMassTemplateDto } from './dto/update-mass-template.dto';
import { UpdateMassTemplateQueryDto } from './dto/update-mass-template-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';

@ApiBearerAuth()
@Roles('Admin Geral', 'Secretaria')
@Controller('mass-templates')
export class MassTemplatesController {
  constructor(private readonly massTemplatesService: MassTemplatesService) {}

  @Auditable('MassTemplate')
  @Post()
  create(@Body() dto: CreateMassTemplateDto) {
    return this.massTemplatesService.create(dto);
  }

  @Get()
  findAll() {
    return this.massTemplatesService.findAll();
  }

  @Auditable('MassTemplate')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMassTemplateDto,
    @Query() query: UpdateMassTemplateQueryDto,
  ) {
    return this.massTemplatesService.update(
      id,
      dto,
      query.removeFuture ?? false,
    );
  }
}
