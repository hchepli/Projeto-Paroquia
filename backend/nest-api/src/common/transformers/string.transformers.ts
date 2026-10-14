import type { TransformFnParams } from 'class-transformer';

export const trimString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** "" vira null (permite limpar um campo opcional no PATCH). */
export const trimToNull = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export const emailToNull = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  return normalized === '' ? null : normalized;
};