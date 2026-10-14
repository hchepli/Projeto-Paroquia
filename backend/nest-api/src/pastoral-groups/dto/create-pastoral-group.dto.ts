// src/pastoral-groups/dto/create-pastoral-group.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { trimString, trimToNull } from '../../common/transformers/string.transformers';

export class CreatePastoralGroupDto {
  @ApiProperty({ example: 'Catequese', maxLength: 120 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: '(47) 99999-0000', maxLength: 120, nullable: true })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contact?: string | null;

  @ApiPropertyOptional({
    description: 'Função sugerida ao escalar voluntários desta pastoral (texto livre). Ex: leitor, coroinha.',
    example: 'leitor',
    maxLength: 80,
    nullable: true,
  })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  defaultRole?: string | null;
}