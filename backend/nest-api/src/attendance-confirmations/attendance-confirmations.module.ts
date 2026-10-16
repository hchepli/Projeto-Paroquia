import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AttendanceConfirmationsService } from './attendance-confirmations.service';
import { AttendanceConfirmationsController } from './attendance-confirmations.controller';

@Module({
  // Config só para o ThrottlerGuard aplicado na rota pública (não é guard global).
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }])],
  controllers: [AttendanceConfirmationsController],
  providers: [AttendanceConfirmationsService],
})
export class AttendanceConfirmationsModule {}
