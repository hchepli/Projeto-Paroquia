'use client';

import { Search } from 'lucide-react';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export default function SearchInput({
  placeholder = 'Pesquisa aqui...',
  value,
  onChange,
  disabled = true,
}: SearchInputProps) {
  return (
    <div className="flex flex-1 w-full items-center gap-2.5 rounded-full border border-[#ECEAE6] bg-white px-5 py-3">
      <Search size={18} className="shrink-0 text-[#B9B7B1]" />
      <input
        type="text"
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full border-none bg-transparent text-sm text-[#1C1C1A] outline-none placeholder:text-[#B9B7B1]"
      />
    </div>
  );
}