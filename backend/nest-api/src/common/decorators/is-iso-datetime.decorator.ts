// src/common/decorators/is-iso-datetime.decorator.ts
import { applyDecorators } from '@nestjs/common';
import { IsISO8601, Matches } from 'class-validator';

// Exige data + hora + fuso (Z ou ±hh:mm). "2026-12-25" puro é rejeitado (400, não 500).
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})$/;

export function IsIsoDateTime() {
  return applyDecorators(
    IsISO8601({ strict: true, strictSeparator: true }),
    Matches(ISO_WITH_OFFSET, { message: '$property deve ser uma data ISO 8601 com hora e fuso (ex: 2026-12-25T19:00:00-03:00)' }),
  );
}