'use client';

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import FieldLabel from './FieldLabel';

export type Option = {
  value: string;
  label: string;
};

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Option[];
  required?: boolean;
  hideLabel?: boolean;
}

export default function SelectInput({
  label,
  value,
  onChange,
  placeholder,
  options,
  required,
  hideLabel,
}: SelectInputProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    setOpen(false);
  }

  return (
    <div>
      <FieldLabel label={label} required={required} hidden={hideLabel} />
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center justify-between px-5 py-3 border border-gray-300 rounded-lg ring-1 ring-gray-400 bg-white text-sm transition duration-150 focus:outline-none focus:ring-1 focus:ring-gray-700 focus:border-gray-700 ${
            selectedOption ? 'text-gray-700' : 'text-gray-400'
          }`}
        >
          <span>{selectedOption?.label || placeholder}</span>
          <ChevronDown
            className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        {open && (
          <div className="absolute z-20 w-full mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="max-h-60 overflow-y-auto p-1.5">
              {options.length === 0 ? (
                <p className="px-4 py-2.5 text-sm text-gray-400">Nenhuma opção disponível.</p>
              ) : (
                options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md text-sm text-left transition ${
                        isSelected
                          ? 'bg-gray-100 text-gray-800'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check className="h-4 w-4 text-gray-700" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}