// src/events/dto/find-events-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindEventsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Se true, inclui eventos cancelados (uso admin)' })
  @IsBooleanString()
  @IsOptional()
  includeAll?: string;
}