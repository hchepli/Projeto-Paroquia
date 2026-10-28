// src/mass-templates/dto/update-mass-template-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateMassTemplateQueryDto {
  @ApiPropertyOptional({
    description: 'Ao desativar, apaga as ocorrências futuras SEM escala',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  removeFuture?: boolean;
}
