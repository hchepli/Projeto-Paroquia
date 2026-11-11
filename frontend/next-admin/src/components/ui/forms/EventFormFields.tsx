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

const labelClass = 'text-sm font-medium text-gray-800';
const hintClass = 'text-sm text-gray-600';

export default function EventFormFields({
  values,
  onChange,
  readOnly,
  showStatus,
}: EventFormFieldsProps) {
  const { data: categories, isError: categoriesError } = useEventCategories();

  return (
    <fieldset disabled={readOnly} className="flex min-w-0 flex-col gap-4 border-0 p-0">
      <TextInput
        label="Nome do evento"
        value={values.name}
        onChange={(v) => onChange({ name: v })}
        required
      />

      <TextareaInput
        label="Descrição (opcional)"
        value={values.description}
        onChange={(v) => onChange({ description: v })}
        rows={3}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextInput
          label="Começa em"
          type="datetime-local"
          value={values.startDate}
          onChange={(v) => onChange({ startDate: v })}
          required
        />
        <TextInput
          label="Termina em (opcional)"
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
      {categoriesError && (
        <p role="alert" className="-mt-2 text-sm text-red-700">
          Não foi possível carregar as categorias. Você pode salvar o evento sem escolher uma.
        </p>
      )}

      <div role="group" aria-labelledby="evento-missa-label" className="flex flex-col gap-1">
        <span id="evento-missa-label" className={labelClass}>
          Esta é uma missa especial? Escolha a missa (opcional)
        </span>
        {!readOnly && (
          <p className={hintClass}>
            Use só se este evento acontece junto com uma missa. Se não for o caso, deixe em branco.
          </p>
        )}
        <MassSearchCombobox value={values.massId} onChange={(v) => onChange({ massId: v })} />
      </div>

      <div role="group" aria-labelledby="evento-pastorais-label" className="flex flex-col gap-1">
        <span id="evento-pastorais-label" className={labelClass}>
          Pastorais que participam (opcional)
        </span>
        {!readOnly && (
          <p className={hintClass}>Marque as pastorais que vão ajudar ou participar deste evento.</p>
        )}
        <PastoralGroupsMultiSelect
          value={values.pastoralGroupIds}
          onChange={(ids) => onChange({ pastoralGroupIds: ids })}
        />
      </div>

      {showStatus && (
        <div className="flex flex-col gap-1">
          <label htmlFor="evento-situacao" className={labelClass}>
            Situação do evento
          </label>
          <select
            id="evento-situacao"
            value={values.status}
            onChange={(e) => onChange({ status: e.target.value as EventStatus })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-[#1a4d8f] focus:ring-2 focus:ring-[#1a4d8f]/30"
          >
            <option value="ACTIVE">Ativo — aparece no calendário e no site</option>
            <option value="CANCELLED">Cancelado — não aparece no calendário nem no site</option>
          </select>
          <p className={hintClass}>
            Cancelar não apaga nada. Para reativar depois, é só voltar para “Ativo”.
          </p>
        </div>
      )}
    </fieldset>
  );
}
