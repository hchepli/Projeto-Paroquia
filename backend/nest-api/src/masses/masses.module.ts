import { Module } from '@nestjs/common';
import { MassesService } from './masses.service';
import { MassesController } from './masses.controller';

@Module({
  controllers: [MassesController],
  providers: [MassesService],
})
export class MassesModule {}
