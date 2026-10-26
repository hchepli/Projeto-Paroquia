import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { NormalizeRole } from '../../schedules/utils/schedule-rules.util';

// Uso ANINHADO em CreateScheduleDto: sem scheduleId (resolvido pelo service).
export class CreateNestedScheduleAssignmentDto {
  @ApiProperty({ example: 1, description: 'ID do voluntário' })
  @IsInt()
  @Min(1)
  volunteerId!: number;

  @ApiProperty({ example: 'leitor', description: 'Função (texto livre; normalizada para minúsculas/sem espaços extras).' })
  @NormalizeRole()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  role!: string;
}