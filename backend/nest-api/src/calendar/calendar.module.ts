import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MassTemplatesModule } from '../mass-templates/mass-templates.module';

@Module({
  imports: [PrismaModule, MassTemplatesModule],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}