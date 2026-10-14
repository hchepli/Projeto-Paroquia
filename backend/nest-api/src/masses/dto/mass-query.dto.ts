// src/masses/dto/mass-query.dto.ts (novo arquivo)
import { Type } from 'class-transformer';
import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class MassQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Início do período (dateTime da Missa)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fim do período (dateTime da Missa)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}