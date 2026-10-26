import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateScheduleAssignmentDto } from './create-schedule-assignment.dto';

// scheduleId fora: mover atribuição entre escalas = remover + adicionar (revalida RN006/RN017/min-1).
export class UpdateScheduleAssignmentDto extends PartialType(
  OmitType(CreateScheduleAssignmentDto, ['scheduleId'] as const),
) {}