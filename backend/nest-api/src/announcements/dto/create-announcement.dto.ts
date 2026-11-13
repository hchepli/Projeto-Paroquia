import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  MaxLength,
  Matches,
} from 'class-validator';
import { AnnouncementStatus } from '../../../generated/prisma/client';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Multipart manda tudo como texto: '' ou 'null' limpam a categoria; número em texto vira número.
const toNullableInt = ({ value }: { value: unknown }) => {
  if (value === '' || value === 'null') return null;
  if (typeof value === 'string') return Number(value);
  return value;
};

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Nova reunião da paróquia', maxLength: 180 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title!: string;

  @ApiPropertyOptional({
    description:
      'Slug explícito. Se omitido, o service gera um único (com sufixo -2, -3... se preciso).',
    example: 'nova-reuniao-da-paroquia',
    maxLength: 180,
  })
  @Transform(trim)
  @IsString()
  @IsOptional()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug?: string;

  @ApiProperty({ description: 'Conteúdo em texto puro (RNF006)', maxLength: 20000 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  content!: string;

  @ApiPropertyOptional({ enum: AnnouncementStatus, default: 'PUBLISHED' })
  @IsEnum(AnnouncementStatus)
  @IsOptional()
  status?: AnnouncementStatus;

  @ApiPropertyOptional({
    description: 'Categoria do tipo ANNOUNCEMENT. null (ou vazio no multipart) limpa no PATCH.',
    nullable: true,
  })
  @Transform(toNullableInt)
  @IsInt()
  @IsOptional() // aceita undefined e null
  categoryId?: number | null;

  // A imagem NÃO é campo do DTO: chega como arquivo "image" (multipart).
  // authorId NÃO entra no body: vem de req.user.userId (RF001).
}