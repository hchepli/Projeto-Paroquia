import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsISO8601, MaxLength, IsInt } from 'class-validator';

export class CreateEventDto {
    @ApiProperty({
        description: 'Nome do evento',
        example: 'Evento de Teste',
        maxLength: 150,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name!: string;

    @ApiPropertyOptional({
        description: 'Slug do evento (se não enviado, geração automática fica a cargo do service)',
        example: 'evento-de-teste',
        maxLength: 180,
    })
    @IsString()
    @IsOptional()
    @MaxLength(180)
    slug?: string;

    @ApiPropertyOptional({
        description: 'Descrição do evento',
        example: 'Descrição do Evento de Teste',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Data de início (ISO 8601)',
        example: '2026-06-20T00:00:00.000Z',
    })
    @IsISO8601()
    @IsNotEmpty()
    startDate!: string;

    @ApiPropertyOptional({
        description: 'Data de fim (ISO 8601). Validação de que endDate > startDate fica no service.',
        example: '2026-06-21T00:00:00.000Z',
    })
    @IsISO8601()
    @IsOptional()
    endDate?: string;

    @ApiProperty({
        description: 'Local do evento',
        example: 'Salão Paroquial',
        maxLength: 180,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(180)
    location!: string;

    @ApiPropertyOptional({
        description: 'Vínculo opcional com uma Missa (RN002)',
    })
    @IsInt()
    @IsOptional()
    massId?: number;

    @ApiPropertyOptional({
        description: 'Categoria do evento',
    })
    @IsInt()
    @IsOptional()
    categoryId?: number;
}