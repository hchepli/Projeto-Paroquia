import FieldLabel from './FieldLabel';

interface TextareaInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  hideLabel?: boolean;
}

export default function TextareaInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  rows = 3,
  hideLabel,
}: TextareaInputProps) {
  return (
    <div>
      <FieldLabel label={label} required={required} hidden={hideLabel} />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-5 py-3 border border-gray-300 rounded-lg ring-1 ring-gray-400 bg-white text-sm placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-gray-700 focus:border-gray-700 transition duration-150"
      />
    </div>
  );
}