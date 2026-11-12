// src/lib/phone-mask.ts
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Máscara BR: (47) 9999-9999 ou (47) 99999-9999. */
export function formatPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Mesma regra do back (8–20 caracteres) + DDD obrigatório (10 a 13 dígitos). */
export function isValidPhone(value: string): boolean {
  const digits = onlyDigits(value).length;
  return digits >= 10 && digits <= 13 && /^[0-9()+\-\s]{8,20}$/.test(value.trim());
}