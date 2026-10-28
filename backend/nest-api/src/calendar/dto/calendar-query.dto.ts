// src/calendar/dto/calendar-query.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsIsoDateTime } from '../../common/decorators/is-iso-datetime.decorator';

export class CalendarQueryDto {
  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
    description: 'Início (ISO 8601 com fuso)',
  })
  @IsIsoDateTime()
  start!: string;

  @ApiProperty({
    example: '2026-01-31T23:59:59.999Z',
    description: 'Fim (ISO 8601 com fuso)',
  })
  @IsIsoDateTime()
  end!: string;
}
