import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { IsIn } from 'class-validator';

export class ScheduleQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra escalas vinculadas a esta Missa' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  massId?: number;

  @ApiPropertyOptional({ description: 'Filtra escalas vinculadas a este Evento' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  eventId?: number;

  @ApiPropertyOptional({ description: 'Filtra escalas que tenham este Voluntário atribuído' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  volunteerId?: number;

  // NOVO: só tem efeito para Admin Geral/Secretaria (RN006/RN008/RN017).
  // Coordenador de Pastoral já tem o escopo fixado automaticamente pelo
  // usuário logado no service — se ele mandar esse param, é ignorado.
  @ApiPropertyOptional({
    description:
      'Filtra escalas por Pastoral. Só tem efeito para Admin Geral/Secretaria; ' +
      'Coordenador de Pastoral é sempre restrito à própria pastoral, independente deste param.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pastoralGroupId?: number;

  @ApiPropertyOptional({ description: 'Início do período (data da Missa/Evento vinculado)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fim do período (data da Missa/Evento vinculado)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Formato de exportação (usado só em /report/export)' })
  @IsOptional()
  @IsIn(['csv', 'pdf'])
  format?: string;
}