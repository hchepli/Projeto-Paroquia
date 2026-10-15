// src/components/ui/forms/MassFormFields.tsx
'use client';

import TextInput from '@/components/ui/inputs/TextInput';
import TextareaInput from '@/components/ui/inputs/TextareaInput';
import SelectInput from '@/components/ui/inputs/SelectInput';
import PastoralGroupsMultiSelect from '@/components/ui/inputs/PastoralGroupsMultiSelect';
import { MASS_TYPE_OPTIONS, WEEKDAY_OPTIONS } from '@/lib/masses/constants';
import { MassFormValues } from '@/lib/masses/form';

interface MassFormFieldsProps {
  values: MassFormValues;
  onChange: (patch: Partial<MassFormValues>) => void;
}

/** Campos compartilhados entre a página "Nova Missa" e o modal de edição. */
export default function MassFormFields({ values, onChange }: MassFormFieldsProps) {
  return (
    <div className="space-y-4">
      <TextInput
        label="Título"
        value={values.title}
        onChange={(v) => onChange({ title: v })}
        placeholder="Missa Dominical"
        required
      />

      {values.recurring ? (
        <div className="grid grid-cols-2 gap-4">
          <SelectInput
            label="Dia da semana"
            value={values.dayOfWeek}
            onChange={(v) => onChange({ dayOfWeek: v })}
            placeholder="Selecione"
            options={WEEKDAY_OPTIONS}
            required
          />
          <TextInput
            label="Horário"
            type="time"
            value={values.time}
            onChange={(v) => onChange({ time: v })}
            required
          />
        </div>
      ) : (
        <TextInput
          label="Data e hora"
          type="datetime-local"
          value={values.dateTime}
          onChange={(v) => onChange({ dateTime: v })}
          required
        />
      )}

      <SelectInput
        label="Tipo"
        value={values.type}
        onChange={(v) => onChange({ type: v })}
        placeholder="Selecione"
        options={MASS_TYPE_OPTIONS}
        required
      />

      <TextInput
        label="Local"
        value={values.location}
        onChange={(v) => onChange({ location: v })}
        placeholder="Igreja Matriz"
        required
      />

      <TextareaInput
        label="Observações"
        value={values.notes}
        onChange={(v) => onChange({ notes: v })}
        rows={2}
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Pastorais participantes {values.recurring ? '' : '(opcional, RN017)'}
        </label>
        <PastoralGroupsMultiSelect
          value={values.pastoralGroupIds}
          onChange={(ids) => onChange({ pastoralGroupIds: ids })}
          disabled={values.recurring}
        />
        {values.recurring && (
          <p className="mt-1 text-xs text-gray-500">
            Missas recorrentes ainda não aceitam Pastorais. Depois que as ocorrências forem
            geradas, edite cada uma pelo Calendário para vincular as Pastorais.
          </p>
        )}
      </div>
    </div>
  );
}
