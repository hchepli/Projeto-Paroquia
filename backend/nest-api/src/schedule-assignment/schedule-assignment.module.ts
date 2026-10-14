import { Module } from '@nestjs/common';
import { ScheduleAssignmentService } from './schedule-assignment.service';
import { ScheduleAssignmentController } from './schedule-assignment.controller';

@Module({
  controllers: [ScheduleAssignmentController],
  providers: [ScheduleAssignmentService],
})
export class ScheduleAssignmentModule {}
