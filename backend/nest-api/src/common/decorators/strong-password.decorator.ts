// src/common/decorators/strong-password.decorator.ts
import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const PASSWORD_RULE_MESSAGE =
  'A senha deve ter de 8 a 72 caracteres, com ao menos 1 letra e 1 número.';

// Máx. 72 porque o bcrypt ignora tudo além de 72 bytes (limite contado em caracteres;
// com acentos o limite em bytes pode ser atingido antes, aceito para este porte de sistema).
export function StrongPassword() {
  return applyDecorators(
    IsString(),
    MinLength(8, { message: PASSWORD_RULE_MESSAGE }),
    MaxLength(72, { message: PASSWORD_RULE_MESSAGE }),
    Matches(/(?=.*\p{L})(?=.*\d)/u, { message: PASSWORD_RULE_MESSAGE }),
  );
}
