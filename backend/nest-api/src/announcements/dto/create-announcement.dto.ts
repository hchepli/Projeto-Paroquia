import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsUrl,
  MaxLength,
  Matches,
} from 'class-validator';
import { AnnouncementStatus } from '../../../generated/prisma/client';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

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
    description: 'Categoria do tipo ANNOUNCEMENT. null limpa a categoria no PATCH.',
    nullable: true,
  })
  @IsInt()
  @IsOptional() // IsOptional aceita undefined E null
  categoryId?: number | null;

  @ApiPropertyOptional({
    description: 'URL https da imagem (Cloudinary). null remove a imagem no PATCH.',
    example: 'https://res.cloudinary.com/.../imagem.jpg',
    maxLength: 255,
    nullable: true,
  })
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(255)
  @IsOptional()
  imageUrl?: string | null;

  // authorId NÃO entra no body: vem de req.user.userId (RF001).
}