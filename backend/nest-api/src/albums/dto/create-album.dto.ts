import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsInt } from 'class-validator';

export class CreateAlbumDto {
    @ApiProperty({
        description: 'Título do Álbum',
        example: 'Álbum de Fotos da Primeira Eucaristia',
        maxLength: 150,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    title!: string;

    @ApiPropertyOptional({
        description: 'Slug do álbum (se não enviado, geração automática fica a cargo do service)',
        example: 'album-primeira-eucaristia',
        maxLength: 150,
    })
    @IsString()
    @IsOptional()
    @MaxLength(150)
    slug?: string;

    @ApiPropertyOptional({
        description: 'Descrição do Álbum',
        example: 'Álbum de fotos da Primeira Eucaristia da Paróquia São José.',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({
        description: 'Vínculo opcional com um Evento (RN003 — álbum pode ser avulso)',
        example: 1,
    })
    @IsInt()
    @IsOptional()
    eventId?: number;
}