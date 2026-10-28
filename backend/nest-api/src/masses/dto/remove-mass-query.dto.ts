// src/masses/dto/remove-mass-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class RemoveMassQueryDto {
  @ApiPropertyOptional({
    description: 'Confirma a exclusão em cascata das Escalas (RN016)',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  confirm?: boolean;
}
