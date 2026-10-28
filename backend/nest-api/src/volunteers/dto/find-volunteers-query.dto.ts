// src/volunteers/dto/find-volunteers-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class FindVolunteersQueryDto {
  @ApiPropertyOptional({
    description:
      'Só tem efeito para Admin Geral/Secretaria. Coordenador é sempre restrito à própria pastoral.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pastoralGroupId?: number;
}
