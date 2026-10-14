// src/common/decorators/normalize-email.decorator.ts
import { Transform } from 'class-transformer';

/** trim + lowercase. Usar no CreateUserDto E no LoginDto (precisam normalizar igual). */
export const NormalizeEmail = () =>
  Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );