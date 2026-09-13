// src/components/ui/inputs/PastoralGroupsMultiSelect.tsx
'use client';

import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';

interface PastoralGroupsMultiSelectProps {
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export default function PastoralGroupsMultiSelect({
  value,
  onChange,
  disabled = false,
}: PastoralGroupsMultiSelectProps) {
  const { data: pastoralGroups, isLoading } = usePastoralGroups();

  function toggle(id: number) {
    if (disabled) return;
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-gray-400">Carregando pastorais...</p>;
  }

  if (!pastoralGroups || pastoralGroups.length === 0) {
    return <p className="text-sm text-gray-400">Nenhuma pastoral cadastrada.</p>;
  }

  return (
    <div
      className={`flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-gray-200 p-2 ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      {pastoralGroups.map((group) => (
        <label
          key={group.id}
          className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
            disabled ? 'cursor-not-allowed' : 'hover:bg-gray-50'
          }`}
        >
          <input
            type="checkbox"
            checked={value.includes(group.id)}
            onChange={() => toggle(group.id)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300 text-[#1a4d8f] focus:ring-[#1a4d8f]"
          />
          {group.name}
        </label>
      ))}
    </div>
  );
}