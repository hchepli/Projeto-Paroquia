// src/volunteers/dto/create-volunteer.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { emailToNull, trimString } from '../../common/transformers/string.transformers';

export const PHONE_REGEX = /^[0-9()+\-\s]{8,20}$/;

export class CreateVolunteerDto {
  @ApiProperty({ example: 'Maria Oliveira', maxLength: 150 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'maria@exemplo.com', maxLength: 180, nullable: true })
  @Transform(emailToNull)
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(180)
  email?: string | null;

  @ApiProperty({ example: '(47) 99999-9999', maxLength: 20 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_REGEX, { message: 'Telefone inválido. Use de 8 a 20 caracteres (números, espaço, +, -, parênteses).' })
  phone!: string;

  @ApiProperty({ description: 'Pastoral do voluntário (RN006/RN009 — obrigatório, 1:N)', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pastoralGroupId!: number;
}