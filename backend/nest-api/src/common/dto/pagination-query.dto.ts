import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsIn, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Número da página (começa em 1)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Busca textual (case-insensitive) no campo principal do recurso',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Campo de ordenação (validado individualmente por cada recurso)',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Direção da ordenação',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}