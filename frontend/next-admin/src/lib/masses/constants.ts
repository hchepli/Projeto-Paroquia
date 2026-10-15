// src/lib/masses/constants.ts

export const MASS_TYPE_OPTIONS = [
  { value: 'COMMON', label: 'Comum' },
  { value: 'SPECIAL', label: 'Especial' },
];

export const MASS_TYPE_LABELS: Record<string, string> = {
  COMMON: 'Comum',
  SPECIAL: 'Especial',
};

export const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const WEEKDAY_OPTIONS = WEEKDAY_LABELS.map((label, idx) => ({
  value: String(idx),
  label,
}));
