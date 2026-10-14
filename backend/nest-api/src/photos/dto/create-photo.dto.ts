import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength, IsInt } from 'class-validator';

export class CreatePhotoDto {
    @ApiProperty({
        description: 'URL da foto (upload real via multipart fica pra outra etapa, RNF008)',
        example: 'https://example.com/foto.jpg',
        maxLength: 255,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    url!: string;

    @ApiPropertyOptional({
        description: 'A foto é a capa do álbum? (default: false). Regra de "só 1 capa por álbum" (RN010) é validada no service.',
        example: false,
    })
    @IsBoolean()
    @IsOptional()
    isCover?: boolean;

    @ApiProperty({
        description: 'ID do Álbum ao qual a foto pertence',
        example: 1,
    })
    @IsInt()
    @IsNotEmpty()
    albumId!: number;
}