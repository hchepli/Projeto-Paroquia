import FieldLabel from './FieldLabel';

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'datetime-local' | 'time' | 'email' | 'tel' | 'url';
  list?: string; // id de um <datalist> renderizado pelo pai, ex: sugestões de função
  hideLabel?: boolean;
}

export default function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
  list,
  hideLabel,
}: TextInputProps) {
  return (
    <div>
      <FieldLabel label={label} required={required} hidden={hideLabel} />
      <input
        type={type}
        list={list}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-5 py-3 border border-gray-300 rounded-lg ring-1 ring-gray-400 bg-white text-sm placeholder-gray-400 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700 focus:border-gray-700 transition duration-150"
      />
    </div>
  );
}