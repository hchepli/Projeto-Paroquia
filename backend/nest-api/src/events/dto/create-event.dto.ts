import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateEventDto {
  @ApiProperty({
    description: 'Nome do evento',
    example: 'Festa Junina 2026',
    maxLength: 150,
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    description:
      'Slug (minúsculas, números e hífens). Se omitido é gerado do nome, com sufixo -2, -3... em colisão. ' +
      'Se informado e já existir: 409.',
    example: 'festa-junina-2026',
    maxLength: 180,
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'O slug deve conter apenas letras minúsculas, números e hífens (ex: festa-junina-2026).',
  })
  slug?: string;

  @ApiPropertyOptional({ description: 'Descrição do evento' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({
    description: 'Data de início (ISO 8601)',
    example: '2026-06-20T18:00:00.000Z',
  })
  @IsISO8601({ strict: true })
  @IsNotEmpty()
  startDate!: string;

  @ApiPropertyOptional({
    description:
      'Data de fim (ISO 8601). Deve ser >= início (validado no service). null limpa o campo.',
    example: '2026-06-20T23:00:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  endDate?: string | null;

  @ApiProperty({
    description: 'Local do evento',
    example: 'Salão Paroquial',
    maxLength: 180,
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  location!: string;

  @ApiPropertyOptional({
    description:
      'Missa correlacionada (RN002). Em PATCH, null remove o vínculo (UC018).',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  massId?: number | null;

  @ApiPropertyOptional({
    description: 'Categoria (deve ser do tipo EVENT). Em PATCH, null remove.',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  categoryId?: number | null;

  @ApiPropertyOptional({
    type: [Number],
    description:
      'Pastorais participantes (RN017). Em PATCH, substitui o conjunto atual.',
    example: [1, 2],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsInt({ each: true })
  pastoralGroupIds?: number[];
}
