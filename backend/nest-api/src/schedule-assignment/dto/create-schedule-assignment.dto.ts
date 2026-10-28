import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { NormalizeRole } from '../../schedules/utils/schedule-rules.util';

export class CreateScheduleAssignmentDto {
  @ApiProperty({
    description: 'ID da Escala (UUID)',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID()
  scheduleId!: string;

  @ApiProperty({ description: 'ID do Voluntário', example: 1 })
  @IsInt()
  @Min(1)
  volunteerId!: number;

  @ApiProperty({
    description: 'Função (texto livre; normalizada para minúsculas)',
    example: 'leitor',
    maxLength: 80,
  })
  @NormalizeRole()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  role!: string;
}
