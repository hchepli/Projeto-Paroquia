// src/masses/dto/create-mass.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize, ArrayUnique, IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength,
} from 'class-validator';
import { MassType } from '../../../generated/prisma/client';
import { IsIsoDateTime } from '../../common/decorators/is-iso-datetime.decorator';
import { Trim } from '../../common/decorators/trim.decorator';

export class CreateMassDto {
  @ApiProperty({ example: 'Missa Dominical', maxLength: 150 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @ApiProperty({ example: '2026-12-25T19:00:00-03:00', description: 'ISO 8601 com hora e fuso' })
  @IsIsoDateTime()
  dateTime!: string;

  @ApiPropertyOptional({ enum: MassType, example: MassType.COMMON })
  @IsOptional()
  @IsEnum(MassType)
  type?: MassType;

  @ApiProperty({ example: 'Igreja Matriz', maxLength: 180 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  location!: string;

  @ApiPropertyOptional({ description: 'Texto puro (sem HTML)', maxLength: 2000 })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    type: [Number],
    description: 'Pastorais participantes (RN017). No PATCH: omitido = não altera; [] = remove todas.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsInt({ each: true })
  pastoralGroupIds?: number[];
}