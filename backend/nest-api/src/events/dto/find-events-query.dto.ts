import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { EventStatus } from '../../../generated/prisma/client';

/** Listagem PÚBLICA: sempre só eventos ACTIVE. (includeAll foi removido: ver GET /events/admin.) */
export class FindEventsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ['upcoming', 'past'],
    description:
      'upcoming = ainda não terminaram (ordem crescente); past = já terminaram (ordem decrescente). ' +
      'Com period, o parâmetro "order" é ignorado.',
  })
  @IsOptional()
  @IsIn(['upcoming', 'past'])
  period?: 'upcoming' | 'past';

  @ApiPropertyOptional({ description: 'Filtra por categoria' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;
}

/** Listagem ADMIN: pode filtrar por status (inclui CANCELLED). */
export class FindAdminEventsQueryDto extends FindEventsQueryDto {
  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
