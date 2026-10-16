// src/common/utils/date-order.util.ts  (reaproveitável por Missas/Eventos)
import { BadRequestException } from '@nestjs/common';

export function assertEndNotBeforeStart(start: Date, end: Date | null | undefined): void {
  if (end && end.getTime() < start.getTime()) {
    throw new BadRequestException('A data de fim não pode ser anterior à data de início.');
  }
}
