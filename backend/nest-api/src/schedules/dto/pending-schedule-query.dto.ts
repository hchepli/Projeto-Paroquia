import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class PendingScheduleQueryDto {
  @ApiProperty({
    example: '2026-09-01T00:00:00.000Z',
    description: 'Início do período (ISO 8601).',
  })
  @IsDateString({}, { message: 'start deve ser uma data válida (ISO 8601).' })
  start!: string;

  @ApiProperty({
    example: '2026-09-30T23:59:59.999Z',
    description: 'Fim do período (ISO 8601).',
  })
  @IsDateString({}, { message: 'end deve ser uma data válida (ISO 8601).' })
  end!: string;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Filtra por Pastoral. Só tem efeito para Admin Geral/Secretaria; o Coordenador é sempre restrito à própria pastoral.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pastoralGroupId?: number;
}