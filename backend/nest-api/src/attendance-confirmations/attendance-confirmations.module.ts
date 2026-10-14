import { Module } from '@nestjs/common';
import { AttendanceConfirmationsService } from './attendance-confirmations.service';
import { AttendanceConfirmationsController } from './attendance-confirmations.controller';

@Module({
  controllers: [AttendanceConfirmationsController],
  providers: [AttendanceConfirmationsService],
})
export class AttendanceConfirmationsModule {}
