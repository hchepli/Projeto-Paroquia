interface FieldLabelProps {
  label: string;
  required?: boolean;
  htmlFor?: string;
  hidden?: boolean; // não renderiza nada, nem o espaço do label
}

export default function FieldLabel({ label, required, htmlFor, hidden }: FieldLabelProps) {
  if (hidden) return null;

  return (
    <label htmlFor={htmlFor} className="block mb-1 text-sm font-medium text-gray-700">
      {label}{' '}
      {required && (
        <span className="text-[#701513] text-[11px] relative -top-[3px] ml-0.5">
          * Obrigatório
        </span>
      )}
    </label>
  );
}