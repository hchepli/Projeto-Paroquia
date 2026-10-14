import { Module } from '@nestjs/common';
import { PastoralGroupsService } from './pastoral-groups.service';
import { PastoralGroupsController } from './pastoral-groups.controller';

@Module({
  controllers: [PastoralGroupsController],
  providers: [PastoralGroupsService],
})
export class PastoralGroupsModule {}
