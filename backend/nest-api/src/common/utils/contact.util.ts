// src/common/utils/contact.util.ts
import { isEmail } from 'class-validator';

const PHONE_CHARS = /^[\d\s()+\-.]+$/;

/**
 * Normaliza o contato para comparação/UNIQUE:
 *  - e-mail   -> trim + lowercase
 *  - telefone -> só dígitos, sem o DDI 55 (quando sobram 12-13 dígitos)
 *  - qualquer outra coisa volta só com trim (o validador a recusa depois)
 */
export function normalizeContact(raw: string): string {
  const value = raw.trim();
  if (value.includes('@')) return value.toLowerCase();
  if (!PHONE_CHARS.test(value)) return value;

  const digits = value.replace(/\D/g, '');
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return digits.slice(2);
  }
  return digits;
}

/** Espera um valor JÁ normalizado: e-mail válido ou telefone BR com DDD (10 ou 11 dígitos). */
export function isValidContact(value: string): boolean {
  if (value.length > 150) return false;
  return isEmail(value) || /^\d{10,11}$/.test(value);
}
