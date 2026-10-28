import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class FaqItemDto {
  @ApiProperty({ example: 'Qual a idade mínima?', maxLength: 300 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  question!: string;

  @ApiProperty({ example: 'Não há idade mínima.', maxLength: 2000 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  answer!: string;
}

export class CreateSacramentDto {
  @ApiProperty({ example: 'Batismo', maxLength: 120 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    description: 'Slug (kebab-case). Se omitido, é gerado a partir do nome.',
    example: 'batismo',
    maxLength: 180,
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug?: string;

  @ApiProperty({ example: 'O Batismo é o primeiro sacramento de iniciação cristã.' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;

  @ApiPropertyOptional({ example: 'Certidão de nascimento, RG dos padrinhos' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(3000)
  requiredDocuments?: string;

  @ApiPropertyOptional({ type: [FaqItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  faq?: FaqItemDto[];

  @ApiPropertyOptional({
    description: 'Ordem de exibição. Se omitido, vai para o final da lista.',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
