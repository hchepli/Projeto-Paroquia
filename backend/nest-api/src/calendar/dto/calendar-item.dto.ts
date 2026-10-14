import { ApiProperty } from '@nestjs/swagger';

export type CalendarItemType = 'mass' | 'event';

export class CalendarItemDto {
  @ApiProperty({ description: 'ID da Mass ou Event de origem', example: 1 })
  id!: number;

  @ApiProperty({ description: 'Título exibido na grade', example: 'Missa Dominical' })
  title!: string;

  @ApiProperty({
    description: 'Data/hora de referência (Mass.dateTime ou Event.startDate)',
    example: '2026-01-04T10:00:00.000Z',
  })
  date!: string;

  @ApiProperty({ description: 'Origem do item', enum: ['mass', 'event'], example: 'mass' })
  type!: CalendarItemType;
}
