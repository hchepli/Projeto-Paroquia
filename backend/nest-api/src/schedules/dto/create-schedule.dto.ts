import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateNestedScheduleAssignmentDto } from '../../schedule-assignment/dto/create-nested-schedule-assignment.dto';

export class CreateScheduleDto {
  // RN007 (Mass XOR Event): validação real fica no service (Dia 2).
  // Aqui, no DTO, ambos continuam opcionais.
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  massId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  eventId?: number;

  @ApiPropertyOptional({
    type: [CreateNestedScheduleAssignmentDto],
    description: 'Atribuições criadas junto com a Escala (pode vir vazio)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => CreateNestedScheduleAssignmentDto)
  assignments?: CreateNestedScheduleAssignmentDto[] = [];

  @ApiPropertyOptional({
    description:
      'Pastoral vinculada à Escala (RN006/RN008/RN017). Preenchido automaticamente se o usuário logado for Coordenador de Pastoral — só Admin Geral/Secretaria podem informar manualmente.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  pastoralGroupId?: number;
}