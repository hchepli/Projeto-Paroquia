// src/lib/masses/form.ts
import { toDateTimeLocalValue } from '@/lib/date/datetime';
import { MassDetail } from '@/types/masses/masses';

export interface MassFormValues {
  title: string;
  type: string;
  location: string;
  notes: string;
  dateTime: string; // datetime-local
  recurring: boolean;
  dayOfWeek: string; // "0".."6"
  time: string; // "HH:mm"
  pastoralGroupIds: number[];
}

export const EMPTY_MASS_FORM: MassFormValues = {
  title: '',
  type: 'COMMON',
  location: '',
  notes: '',
  dateTime: '',
  recurring: false,
  dayOfWeek: '1',
  time: '19:00',
  pastoralGroupIds: [],
};

export function massToFormValues(mass: MassDetail): MassFormValues {
  return {
    ...EMPTY_MASS_FORM,
    title: mass.title,
    type: mass.type,
    location: mass.location,
    notes: mass.notes ?? '',
    dateTime: toDateTimeLocalValue(mass.dateTime),
    pastoralGroupIds: (mass.pastoralGroups ?? [])
      .map((g) => g.pastoralGroup?.id)
      .filter((id): id is number => typeof id === 'number'),
  };
}

export function validateMassForm(values: MassFormValues): string | null {
  if (!values.title.trim() || !values.location.trim()) {
    return 'Título e local são obrigatórios.';
  }
  if (values.recurring) {
    if (!values.time) return 'Preencha o horário.';
  } else if (!values.dateTime) {
    return 'Preencha data e hora.';
  }
  return null;
}
