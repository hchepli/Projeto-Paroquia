import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, MaxLength } from 'class-validator';
import { AnnouncementStatus } from '../../../generated/prisma/client';

export class CreateAnnouncementDto {
    @ApiProperty({
        description: 'Título do Comunicado',
        example: 'Nova reunião da paróquia',
        maxLength: 180,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(180)
    title!: string;

    @ApiPropertyOptional({
        description: 'Slug do comunicado (se não enviado, geração automática fica a cargo do service)',
        example: 'nova-reuniao-da-paroquia',
        maxLength: 180,
    })
    @IsString()
    @IsOptional()
    @MaxLength(180)
    slug?: string;

    @ApiProperty({
        description: 'Conteúdo do Comunicado',
        example: 'Detalhes sobre a nova reunião da paróquia.',
    })
    @IsString()
    @IsNotEmpty()
    content!: string;

    @ApiPropertyOptional({
        description: 'Status do Comunicado (default: PUBLISHED)',
        enum: AnnouncementStatus,
        example: AnnouncementStatus.PUBLISHED,
    })
    @IsEnum(AnnouncementStatus)
    @IsOptional()
    status?: AnnouncementStatus;

    @ApiPropertyOptional()
    @IsInt()
    @IsOptional()
    categoryId?: number;

    @ApiPropertyOptional({
        description: 'Url da imagem do Comunicado (validação de tipo/tamanho de arquivo real é upload, RNF008, fica pra outra etapa)',
        example: 'https://example.com/imagem.jpg',
    })
    @IsString()
    @IsOptional()
    imageUrl?: string;

    // authorId NÃO entra no DTO do body — é preenchido pelo service a partir
    // do usuário autenticado (RF001/RF002, quando auth existir via JWT).
}