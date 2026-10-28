import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindAttendanceConfirmationsQueryDto extends PaginationQueryDto {
  @ApiProperty({
    description: 'Evento cujas confirmações serão listadas (obrigatório)',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  eventId!: number;
}
