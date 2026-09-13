interface FormActionsProps {
  onCancel: () => void;
  submitLabel: string;
  submitting?: boolean;
}

export default function FormActions({ onCancel, submitLabel, submitting }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-4">
      <button
        type="button"
        onClick={onCancel}
        className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#701513] hover:bg-[#5a100f] transition disabled:opacity-50"
      >
        {submitting ? 'Salvando...' : submitLabel}
      </button>
    </div>
  );
}