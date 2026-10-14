// src/components/ui/dropdowns/PastoralSwitcher.tsx
'use client';

import { useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useOnClickOutside } from '@/hooks/ui/useOnClickOutside';
import { PastoralGroup } from '@/types/pastoral-groups/pastoral-group';

interface PastoralSwitcherProps {
  pastoralGroups: PastoralGroup[];
  selectedId: number | null; // null = "Todas as Pastorais"
  onSelect: (id: number | null) => void;
}

export default function PastoralSwitcher({
  pastoralGroups,
  selectedId,
  onSelect,
}: PastoralSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center rounded-full border border-[rgba(0,0,0,0.2)] p-1.5 hover:bg-[rgba(0,0,0,0.05)]"
        aria-label="Trocar Pastoral"
      >
        <ChevronDown size={18} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-10 mt-2 w-56 rounded-[12px] border border-[rgba(0,0,0,0.1)] bg-white p-1 shadow-lg">
          <button
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[rgba(0,0,0,0.05)]"
          >
            Todas as Pastorais
            {selectedId === null && <Check size={14} />}
          </button>

          {pastoralGroups.map((pg) => (
            <button
              key={pg.id}
              onClick={() => {
                onSelect(pg.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[rgba(0,0,0,0.05)]"
            >
              {pg.name}
              {selectedId === pg.id && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}