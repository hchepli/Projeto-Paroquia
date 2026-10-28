// src/components/ui/forms/SacramentFormFields.tsx
'use client';

import { SACRAMENT_LIMITS, SacramentFormValues } from '@/lib/sacraments/form';

interface Props {
  values: SacramentFormValues;
  onChange: (patch: Partial<SacramentFormValues>) => void;
  readOnly?: boolean;
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-gray-900 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500';

// RNF006: tudo aqui é texto controlado pelo React (escapado por padrão).
// NUNCA renderizar estes campos com dangerouslySetInnerHTML.
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
        <label htmlFor="sac-name" className="mb-1 block text-sm font-medium text-gray-700">
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
        <label htmlFor="sac-slug" className="mb-1 block text-sm font-medium text-gray-700">
          Slug (endereço no site)
        </label>
        <input
          id="sac-slug"
          className={inputClass}
          value={values.slug}
          maxLength={L.slug}
          disabled={readOnly}
          onChange={(e) => onChange({ slug: e.target.value.toLowerCase() })}
          placeholder="Deixe em branco para gerar a partir do nome"
        />
        <p className="mt-1 text-xs text-gray-500">
          Só letras minúsculas, números e hífens. Alterar muda o link público do sacramento.
        </p>
      </div>

      <div>
        <label htmlFor="sac-desc" className="mb-1 block text-sm font-medium text-gray-700">
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
        <label htmlFor="sac-docs" className="mb-1 block text-sm font-medium text-gray-700">
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
        <legend className="mb-1 text-sm font-medium text-gray-700">Perguntas frequentes</legend>

        {values.faq.length === 0 && (
          <p className="text-sm text-gray-500">Nenhuma pergunta cadastrada.</p>
        )}

        {values.faq.map((item, index) => (
          <div key={index} className="space-y-2 rounded-md border border-gray-200 p-3">
            <input
              aria-label={`Pergunta ${index + 1}`}
              className={inputClass}
              value={item.question}
              maxLength={L.question}
              disabled={readOnly}
              onChange={(e) => updateFaq(index, { question: e.target.value })}
              placeholder="Pergunta"
            />
            <textarea
              aria-label={`Resposta ${index + 1}`}
              rows={2}
              className={inputClass}
              value={item.answer}
              maxLength={L.answer}
              disabled={readOnly}
              onChange={(e) => updateFaq(index, { answer: e.target.value })}
              placeholder="Resposta"
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeFaq(index)}
                className="text-xs font-medium text-red-600 hover:underline"
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
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Adicionar pergunta
          </button>
        )}
      </fieldset>
    </div>
  );
}
