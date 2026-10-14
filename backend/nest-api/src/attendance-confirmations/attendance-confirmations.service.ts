import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateAttendanceConfirmationDto } from './dto/create-attendance-confirmation.dto';
import { UpdateAttendanceConfirmationDto } from './dto/update-attendance-confirmation.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class AttendanceConfirmationsService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createAttendanceConfirmationDto: CreateAttendanceConfirmationDto) {
    try{
      return await this.prismaService.attendanceConfirmation.create({ data: createAttendanceConfirmationDto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe uma confirmação de presença com esse nome');
      }
      throw error;
    }
  }

  findAll() {
    return this.prismaService.attendanceConfirmation.findMany();
  }

  async findOne(id: string) {
    const attendanceConfirmation = await this.prismaService.attendanceConfirmation.findUnique({
      where: { id },
    });
    if (!attendanceConfirmation) {
      throw new NotFoundException('Confirmação de presença não encontrada');
    }
    return attendanceConfirmation;
  }

  async update(id: string, updateAttendanceConfirmationDto: UpdateAttendanceConfirmationDto) {
    await this.findOne(id);
    try{
      return await this.prismaService.attendanceConfirmation.update({ where: { id }, data: updateAttendanceConfirmationDto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe uma confirmação de presença com esse nome');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return await this.prismaService.attendanceConfirmation.delete({ where: { id } });
  }
}
