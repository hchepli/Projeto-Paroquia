// src/common/validators/is-contact.validator.ts
import { Transform } from 'class-transformer';
import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidContact, normalizeContact } from '../utils/contact.util';

/** Normaliza (Transform) e valida: e-mail ou telefone BR com DDD. */
export function IsContact(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    Transform(({ value }) =>
      typeof value === 'string' ? normalizeContact(value) : value,
    )(object, propertyName);
    registerDecorator({
      name: 'isContact',
      target: object.constructor,
      propertyName,
      options: {
        message:
          'Informe um e-mail válido ou um telefone com DDD (10 ou 11 dígitos).',
        ...validationOptions,
      },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && isValidContact(value),
      },
    });
  };
}
