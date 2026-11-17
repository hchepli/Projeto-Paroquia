'use client';

import { SACRAMENT_LIMITS, SacramentFormValues } from '@/lib/sacraments/form';

interface Props {
  values: SacramentFormValues;
  onChange: (patch: Partial<SacramentFormValues>) => void;
  readOnly?: boolean;
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-800 focus:border-gray-900 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500';
const labelClass = 'mb-1 block text-base font-medium text-gray-700';

// RNF006: texto controlado pelo React (escapado). NUNCA usar dangerouslySetInnerHTML aqui.
export default function SacramentFormFields({ values, onChange, readOnly = false }: Props) {
  const L = SACRAMENT_LIMITS;

  function updateFaq(index: number, patch: Partial<{ question: string; answer: string }>) {
    onChange({ faq: values.faq.map((item, i) => (i === index ? { ...item, ...patch } : item)) });
  }
  function removeFaq(index: number) {
    onChange({ faq: values.faq.filter((_, i) => i !== index) });
  }
  function addFaq() {
    onChange({ faq: [...values.faq, { question: '', answer: '' }] });
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="sac-name" className={labelClass}>
          Nome *
        </label>
        <input
          id="sac-name"
          className={inputClass}
          value={values.name}
          maxLength={L.name}
          disabled={readOnly}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ex.: Batismo"
        />
      </div>

      <div>
        <label htmlFor="sac-desc" className={labelClass}>
          Descrição *
        </label>
        <textarea
          id="sac-desc"
          rows={5}
          className={inputClass}
          value={values.description}
          maxLength={L.description}
          disabled={readOnly}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="sac-docs" className={labelClass}>
          Documentos necessários
        </label>
        <textarea
          id="sac-docs"
          rows={3}
          className={inputClass}
          value={values.requiredDocuments}
          maxLength={L.requiredDocuments}
          disabled={readOnly}
          onChange={(e) => onChange({ requiredDocuments: e.target.value })}
          placeholder="Ex.: Certidão de nascimento, RG dos padrinhos"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className={labelClass}>Perguntas frequentes</legend>

        {values.faq.length === 0 && (
          <p className="text-base text-gray-500">Nenhuma pergunta cadastrada.</p>
        )}

        {values.faq.map((item, index) => (
          <div key={index} className="space-y-2 rounded-md border border-gray-200 p-3">
            <label htmlFor={`sac-q-${index}`} className="block text-sm font-medium text-gray-600">
              Pergunta {index + 1}
            </label>
            <input
              id={`sac-q-${index}`}
              className={inputClass}
              value={item.question}
              maxLength={L.question}
              disabled={readOnly}
              onChange={(e) => updateFaq(index, { question: e.target.value })}
            />
            <label htmlFor={`sac-a-${index}`} className="block text-sm font-medium text-gray-600">
              Resposta {index + 1}
            </label>
            <textarea
              id={`sac-a-${index}`}
              rows={2}
              className={inputClass}
              value={item.answer}
              maxLength={L.answer}
              disabled={readOnly}
              onChange={(e) => updateFaq(index, { answer: e.target.value })}
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeFaq(index)}
                aria-label={`Remover pergunta ${index + 1}`}
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Remover pergunta
              </button>
            )}
          </div>
        ))}

        {!readOnly && values.faq.length < L.faqItems && (
          <button
            type="button"
            onClick={addFaq}
            className="rounded-md border border-gray-300 px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            + Adicionar pergunta
          </button>
        )}
      </fieldset>
    </div>
  );
}