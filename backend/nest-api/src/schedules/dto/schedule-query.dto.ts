import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ScheduleQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra escalas desta Missa' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  massId?: number;

  @ApiPropertyOptional({ description: 'Filtra escalas deste Evento' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  eventId?: number;

  @ApiPropertyOptional({ description: 'Filtra escalas com este Voluntário atribuído' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  volunteerId?: number;

  @ApiPropertyOptional({ description: 'Só tem efeito para Admin Geral/Secretaria; Coordenador é sempre restrito à própria pastoral.' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pastoralGroupId?: number;

  @ApiPropertyOptional({ description: 'Início do período (data da Missa/Evento)' })
  @IsOptional() @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fim do período (data da Missa/Evento)' })
  @IsOptional() @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Formato (só em /report/export)', enum: ['csv', 'pdf'] })
  @IsOptional() @IsIn(['csv', 'pdf'])
  format?: 'csv' | 'pdf';
}