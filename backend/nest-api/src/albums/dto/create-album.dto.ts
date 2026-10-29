import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsInt,
  Matches,
} from 'class-validator';

export class CreateAlbumDto {
  @ApiProperty({ description: 'Título do Álbum', example: 'Festa Junina 2026', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @ApiPropertyOptional({
    description: 'Slug (opcional). Se omitido, é gerado do título com sufixo -2, -3... se já existir.',
    example: 'festa-junina-2026',
    maxLength: 150,
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug?: string;

  @ApiPropertyOptional({ description: 'Descrição do Álbum' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Evento vinculado (RN003 — álbum pode ser avulso)', example: 1 })
  @IsInt()
  @IsOptional()
  eventId?: number;
}