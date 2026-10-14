import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { CategoryType } from '../../../generated/prisma/client';

export class CreateCategoryDto {
    @ApiProperty({
        description: 'Nome da categoria',
        example: 'Categoria de Teste',
        maxLength: 80,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(80)
    name!: string;

    @ApiProperty({
        description: 'Tipo da categoria',
        enum: CategoryType,
        example: CategoryType.EVENT,
    })
    @IsEnum(CategoryType)
    @IsNotEmpty()
    type!: CategoryType;
}