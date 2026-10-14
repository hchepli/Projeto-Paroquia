import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { MassType } from '../../../generated/prisma/client';

export class CreateMassTemplateDto {
  @ApiProperty({ description: 'Dia da semana (0=domingo ... 6=sábado)', example: 1 })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ description: 'Horário no formato HH:mm', example: '19:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'time deve estar no formato HH:mm (ex: "19:00")',
  })
  time!: string;

  @ApiProperty({ example: 'Missa Semanal' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Igreja Matriz' })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({ enum: MassType, default: MassType.COMMON, required: false })
  @IsOptional()
  @IsEnum(MassType)
  type?: MassType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ default: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}