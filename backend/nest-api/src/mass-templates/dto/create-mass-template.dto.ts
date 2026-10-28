// src/mass-templates/dto/create-mass-template.dto.ts
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
  MaxLength,
  Min,
} from 'class-validator';
import { MassType } from '../../../generated/prisma/client';
import { Trim } from '../../common/decorators/trim.decorator';

export class CreateMassTemplateDto {
  @ApiProperty({
    description: 'Dia da semana (0=domingo ... 6=sábado)',
    example: 1,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({
    description: 'Horário HH:mm (America/Sao_Paulo)',
    example: '19:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'time deve estar no formato HH:mm (ex: "19:00")',
  })
  time!: string;

  @ApiProperty({ example: 'Missa Semanal' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @ApiProperty({ example: 'Igreja Matriz' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  location!: string;

  @ApiProperty({ enum: MassType, required: false })
  @IsOptional()
  @IsEnum(MassType)
  type?: MassType;

  @ApiProperty({ required: false })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ default: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
