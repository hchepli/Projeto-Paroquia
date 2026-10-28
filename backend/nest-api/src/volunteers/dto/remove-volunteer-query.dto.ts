// src/volunteers/dto/remove-volunteer-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class RemoveVolunteerQueryDto {
  @ApiPropertyOptional({
    description:
      'true = confirma a remoção junto com as atribuições em escalas (UC009).',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  confirm?: boolean;
}
