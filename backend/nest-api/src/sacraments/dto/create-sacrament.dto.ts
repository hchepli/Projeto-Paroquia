import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray, MaxLength } from 'class-validator';

export class CreateSacramentDto {
    @ApiProperty({
        description: 'Nome do sacramento',
        example: 'Batismo',
        maxLength: 120,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name!: string;

    @ApiPropertyOptional({
        description: 'Slug do sacramento (se não enviado, geração automática fica a cargo do service)',
        example: 'batismo',
        maxLength: 180,
    })
    @IsString()
    @IsOptional()
    @MaxLength(180)
    slug?: string;

    @ApiProperty({
        description: 'Descrição do sacramento',
        example: 'O Batismo é o primeiro sacramento de iniciação cristã.',
    })
    @IsString()
    @IsNotEmpty()
    description!: string;

    @ApiPropertyOptional({
        description: 'Documentos necessários para o sacramento',
        example: 'Certidão de nascimento, RG dos padrinhos',
    })
    @IsString()
    @IsOptional()
    requiredDocuments?: string;

    @ApiPropertyOptional({
        description: 'Perguntas frequentes (array de objetos { pergunta, resposta })',
        example: [{ question: 'Qual a idade mínima?', answer: 'Não há idade mínima.' }],
        type: [Object],
    })
    @IsArray()
    @IsOptional()
    faq?: any[];

    @ApiPropertyOptional({
        description: 'Ordem de exibição (default: 0)',
        example: 0,
    })
    @IsInt()
    @IsOptional()
    displayOrder?: number;
}