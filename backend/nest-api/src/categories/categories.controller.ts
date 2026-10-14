import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Auditable } from '../audit-logs/decorators/auditable.decorator';

@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Auditable('Category')
  @Roles('Admin Geral', 'Secretaria')
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  // Sem @Public() por ora: sem UC dedicado, tratado como dado auxiliar de admin.
  // Sem @Roles(): qualquer usuário autenticado pode listar/ver.
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.categoriesService.findOne(+id);
  }

  @Auditable('Category')
  @Roles('Admin Geral', 'Secretaria')
  @Patch(':id')
  update(@Param('id') id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }

  @Auditable('Category')
  @Roles('Admin Geral', 'Secretaria')
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.categoriesService.remove(+id);
  }
}