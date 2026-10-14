import { PartialType } from '@nestjs/swagger';
import { CreateScheduleAssignmentDto } from './create-schedule-assignment.dto';

export class UpdateScheduleAssignmentDto extends PartialType(CreateScheduleAssignmentDto) {}
