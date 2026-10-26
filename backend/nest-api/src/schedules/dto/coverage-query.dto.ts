import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** Usado por GET /schedules/coverage e /schedules/pending (período máx. 366 dias, validado no service). */
export class CoverageQueryDto {
  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  @IsDateString({}, { message: 'start deve ser uma data válida (ISO 8601).' })
  start!: string;

  @ApiProperty({ example: '2026-09-30T23:59:59.999Z' })
  @IsDateString({}, { message: 'end deve ser uma data válida (ISO 8601).' })
  end!: string;

  @ApiPropertyOptional({ description: 'Só tem efeito para Admin Geral/Secretaria; Coordenador é sempre restrito à própria pastoral.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pastoralGroupId?: number;
}
