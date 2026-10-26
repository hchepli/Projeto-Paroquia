import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateNestedScheduleAssignmentDto } from '../../schedule-assignment/dto/create-nested-schedule-assignment.dto';

export class CreateScheduleDto {
  // RN007 (Missa XOR Evento): validada no service E por CHECK no banco.
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  massId?: number | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  eventId?: number | null;

  @ApiProperty({ type: [CreateNestedScheduleAssignmentDto], description: 'Pelo menos 1 atribuição.' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateNestedScheduleAssignmentDto)
  assignments!: CreateNestedScheduleAssignmentDto[];

  @ApiPropertyOptional({
    description:
      'Pastoral da Escala (RN006/RN008/RN017). Obrigatória para Admin Geral/Secretaria. ' +
      'Para Coordenador é IGNORADA: vale sempre a pastoral do token.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  pastoralGroupId?: number;
}