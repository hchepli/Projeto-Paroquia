import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createCategoryDto: CreateCategoryDto) {
    try {
      return await this.prismaService.category.create({ data: createCategoryDto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe uma categoria com esse nome');
      }
      throw error;
    }
  }

  findAll() {
    return  this.prismaService.category.findMany();
  }

  async findOne(id: number) {
    const category = await this.prismaService.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);
    try {
      return await this.prismaService.category.update({ where: { id }, data: updateCategoryDto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe uma categoria com esse nome');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prismaService.category.delete({ where: { id } });
  }
}
