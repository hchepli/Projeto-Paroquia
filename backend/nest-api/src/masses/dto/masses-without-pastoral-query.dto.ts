// src/masses/dto/masses-without-pastoral-query.dto.ts
import { IsISO8601, IsOptional } from 'class-validator';

export class MassesWithoutPastoralQueryDto {
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;
}
