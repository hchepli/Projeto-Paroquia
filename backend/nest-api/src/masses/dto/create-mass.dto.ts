import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { MassType } from '../../../generated/prisma/client';

export class CreateMassDto {
    @ApiProperty({
        description: 'Título da missa',
        example: 'Missa de Teste',
        maxLength: 150,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    title!: string;

    @ApiProperty({
        description: 'Data e hora da missa (ISO 8601)',
        example: '2026-01-01T10:00:00.000Z',
    })
    @IsDateString()
    @IsNotEmpty()
    dateTime!: string;

    @ApiPropertyOptional({
        description: 'Tipo da missa (default: COMMON)',
        enum: MassType,
        example: MassType.COMMON,
    })
    @IsEnum(MassType)
    @IsOptional()
    type?: MassType;

    @ApiProperty({
        description: 'Local da missa',
        example: 'Igreja Matriz',
        maxLength: 180,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(180)
    location!: string;

    @ApiPropertyOptional({
        description: 'Observações adicionais sobre a missa',
        example: 'Missa especial de fim de ano',
    })
    @IsString()
    @IsOptional()
    notes?: string;
}