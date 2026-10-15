// src/common/utils/date-range.util.ts
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';

const DAY_MS = 24 * 60 * 60 * 1000;

export function assertValidRange(start: Date, end: Date, maxDays?: number): void {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new BadRequestException('Período inválido.');
  }
  if (start.getTime() > end.getTime()) {
    throw new BadRequestException('A data inicial deve ser anterior ou igual à data final.');
  }
  if (maxDays !== undefined && end.getTime() - start.getTime() > maxDays * DAY_MS) {
    throw new BadRequestException(`O período máximo permitido é de ${maxDays} dias.`);
  }
}

export function buildDateRangeFilter(start?: string, end?: string): Prisma.DateTimeFilter | undefined {
  if (!start && !end) return undefined;
  const gte = start ? new Date(start) : undefined;
  const lte = end ? new Date(end) : undefined;
  if (gte && lte) assertValidRange(gte, lte);
  return { ...(gte && { gte }), ...(lte && { lte }) };
}