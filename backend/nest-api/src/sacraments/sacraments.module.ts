import { Module } from '@nestjs/common';
import { SacramentsService } from './sacraments.service';
import { SacramentsController } from './sacraments.controller';

@Module({
  controllers: [SacramentsController],
  providers: [SacramentsService],
})
export class SacramentsModule {}
