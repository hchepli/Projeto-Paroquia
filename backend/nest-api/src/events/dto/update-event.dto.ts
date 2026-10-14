// src/events/dto/update-event.dto.ts
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { EventStatus } from '../../../generated/prisma/client';
import { CreateEventDto } from './create-event.dto';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @ApiPropertyOptional({
    description: 'Status do evento (RN — cancelamento sem exclusão)',
    enum: EventStatus,
    example: EventStatus.CANCELLED,
  })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;
}