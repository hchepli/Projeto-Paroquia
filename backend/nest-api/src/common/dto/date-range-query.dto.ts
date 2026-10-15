// src/common/dto/date-range-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { IsIsoDateTime } from '../decorators/is-iso-datetime.decorator';

export class DateRangeQueryDto {
  @ApiPropertyOptional({ description: 'Início do período (ISO 8601 com fuso)' })
  @IsOptional()
  @IsIsoDateTime()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fim do período (ISO 8601 com fuso)' })
  @IsOptional()
  @IsIsoDateTime()
  endDate?: string;
}