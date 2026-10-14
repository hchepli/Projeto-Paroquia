import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty } from 'class-validator';

export class CalendarQueryDto {
  @ApiProperty({
    description: 'Início do período (ISO 8601, inclusive)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  start!: string;

  @ApiProperty({
    description: 'Fim do período (ISO 8601, inclusive)',
    example: '2026-01-31T23:59:59.999Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  end!: string;
}
