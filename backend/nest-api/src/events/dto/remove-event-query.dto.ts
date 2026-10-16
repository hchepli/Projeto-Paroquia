import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class RemoveEventQueryDto {
  @ApiPropertyOptional({
    description: 'RN016: confirma a exclusão mesmo havendo Escalas vinculadas (elas serão apagadas).',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  confirm?: boolean;
}
