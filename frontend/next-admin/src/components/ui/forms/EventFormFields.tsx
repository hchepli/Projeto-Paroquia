// src/components/ui/forms/EventFormFields.tsx
'use client';

import TextInput from '@/components/ui/inputs/TextInput';
import TextareaInput from '@/components/ui/inputs/TextareaInput';
import SelectInput from '@/components/ui/inputs/SelectInput';
import MassSearchCombobox from '@/components/ui/inputs/MassSearchCombobox';
import PastoralGroupsMultiSelect from '@/components/ui/inputs/PastoralGroupsMultiSelect';
import { useEventCategories } from '@/hooks/categories/useCategories';
import { EventFormValues } from '@/lib/events/form';
import { EventStatus } from '@/types/events/events';

interface EventFormFieldsProps {
  values: EventFormValues;
  onChange: (patch: Partial<EventFormValues>) => void;
  /** Coordenador: tudo desabilitado (fieldset disabled desliga inputs e chips). */
  readOnly?: boolean;
  showStatus?: boolean;
}

export default function EventFormFields({
  values,
  onChange,
  readOnly,
  showStatus,
}: EventFormFieldsProps) {
  const { data: categories } = useEventCategories();

  return (
    <fieldset disabled={readOnly} className="flex min-w-0 flex-col gap-4 border-0 p-0">
      <TextInput label="Nome" value={values.name} onChange={(v) => onChange({ name: v })} required />

      <TextareaInput
        label="Descrição (opcional)"
        value={values.description}
        onChange={(v) => onChange({ description: v })}
        rows={3}
      />

      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Início"
          type="datetime-local"
          value={values.startDate}
          onChange={(v) => onChange({ startDate: v })}
          required
        />
        <TextInput
          label="Fim (opcional)"
          type="datetime-local"
          value={values.endDate}
          onChange={(v) => onChange({ endDate: v })}
        />
      </div>

      <TextInput
        label="Local"
        value={values.location}
        onChange={(v) => onChange({ location: v })}
        required
      />

      <SelectInput
        label="Categoria (opcional)"
        value={values.categoryId}
        onChange={(v) => onChange({ categoryId: v })}
        placeholder="Nenhuma"
        options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
      />

      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-gray-700">
          Vincular a uma Missa (opcional, RN002)
        </label>
        <MassSearchCombobox value={values.massId} onChange={(v) => onChange({ massId: v })} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-gray-700">
          Pastorais participantes (opcional, RN017)
        </label>
        <PastoralGroupsMultiSelect
          value={values.pastoralGroupIds}
          onChange={(ids) => onChange({ pastoralGroupIds: ids })}
        />
      </div>

      {showStatus && (
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Status</label>
          <select
            value={values.status}
            onChange={(e) => onChange({ status: e.target.value as EventStatus })}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
          >
            <option value="ACTIVE">Ativo</option>
            <option value="CANCELLED">Cancelado (some do calendário e do site)</option>
          </select>
        </div>
      )}
    </fieldset>
  );
}