import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateSacramentDto } from './dto/create-sacrament.dto';
import { UpdateSacramentDto } from './dto/update-sacrament.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { generateSlug } from '../common/utils/slug.util';

@Injectable()
export class SacramentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createSacramentDto: CreateSacramentDto) {
    const { slug, ...rest } = createSacramentDto;
    const finalSlug = slug ?? generateSlug(rest.name);

    try {
      return await this.prismaService.sacrament.create({
        data: { ...rest, slug: finalSlug },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um sacramento com esse nome');
      }
      throw error;
    }
  }

  findAll() {
    return this.prismaService.sacrament.findMany();
  }

  async findOne(id: number) {
    const sacrament = await this.prismaService.sacrament.findUnique({ where: { id } });
    if (!sacrament) {
      throw new NotFoundException('Sacramento não encontrado');
    }
    return sacrament;
  }

  async update(id: number, updateSacramentDto: UpdateSacramentDto) {
    await this.findOne(id);
    try {
      return await this.prismaService.sacrament.update({ where: { id }, data: updateSacramentDto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um sacramento com esse nome');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prismaService.sacrament.delete({ where: { id } });
  }
}