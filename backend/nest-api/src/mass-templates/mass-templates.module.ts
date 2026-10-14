import { Module } from '@nestjs/common';
import { MassTemplatesService } from './mass-templates.service';
import { MassTemplatesController } from './mass-templates.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MassTemplatesController],
  providers: [MassTemplatesService],
  exports: [MassTemplatesService], // usado pelo CalendarModule
})
export class MassTemplatesModule {}