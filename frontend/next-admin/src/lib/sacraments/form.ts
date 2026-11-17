import { Sacrament, SacramentFaqItem, SacramentPayload } from '@/types/sacraments/sacraments';

export interface SacramentFormValues {
  name: string;
  description: string;
  requiredDocuments: string;
  faq: SacramentFaqItem[];
}

export const EMPTY_SACRAMENT_FORM: SacramentFormValues = {
  name: '',
  description: '',
  requiredDocuments: '',
  faq: [],
};

// Limites espelham o DTO do back (create-sacrament.dto.ts).
export const SACRAMENT_LIMITS = {
  name: 120,
  description: 5000,
  requiredDocuments: 3000,
  faqItems: 30,
  question: 300,
  answer: 2000,
};

export function sacramentToFormValues(s: Sacrament): SacramentFormValues {
  return {
    name: s.name,
    description: s.description,
    requiredDocuments: s.requiredDocuments ?? '',
    faq: (s.faq ?? []).map((i) => ({ question: i.question, answer: i.answer })),
  };
}

// Linhas totalmente vazias são ignoradas; meio preenchidas dão aviso.
function filledFaq(faq: SacramentFaqItem[]) {
  return faq.filter((i) => i.question.trim() || i.answer.trim());
}

export function validateSacramentForm(v: SacramentFormValues): string | null {
  const L = SACRAMENT_LIMITS;
  const name = v.name.trim();
  if (!name) return 'Escreva o nome do sacramento.';
  if (name.length > L.name) return `O nome pode ter no máximo ${L.name} letras.`;
  // O back gera o endereço do site a partir do nome; precisa de ao menos 1 letra ou número.
  if (!/[a-z0-9]/i.test(name.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
    return 'O nome precisa ter pelo menos uma letra ou número.';
  }

  if (!v.description.trim()) return 'Escreva a descrição do sacramento.';
  if (v.description.trim().length > L.description) {
    return `A descrição pode ter no máximo ${L.description} letras.`;
  }
  if (v.requiredDocuments.trim().length > L.requiredDocuments) {
    return `Os documentos necessários podem ter no máximo ${L.requiredDocuments} letras.`;
  }

  const faq = filledFaq(v.faq);
  if (faq.length > L.faqItems) return `Você pode ter no máximo ${L.faqItems} perguntas frequentes.`;
  for (const [i, item] of faq.entries()) {
    if (!item.question.trim() || !item.answer.trim()) {
      return `Pergunta ${i + 1}: escreva a pergunta e a resposta, ou remova esta pergunta.`;
    }
    if (item.question.trim().length > L.question) {
      return `Pergunta ${i + 1}: a pergunta está muito longa (máximo ${L.question} letras).`;
    }
    if (item.answer.trim().length > L.answer) {
      return `Pergunta ${i + 1}: a resposta está muito longa (máximo ${L.answer} letras).`;
    }
  }
  return null;
}

export function buildSacramentPayload(
  v: SacramentFormValues,
  mode: 'create' | 'edit',
): SacramentPayload {
  return {
    name: v.name.trim(),
    description: v.description.trim(),
    // Na edição, '' limpa o campo; na criação, simplesmente omite.
    ...(mode === 'edit' || v.requiredDocuments.trim()
      ? { requiredDocuments: v.requiredDocuments.trim() }
      : {}),
    faq: filledFaq(v.faq).map((i) => ({
      question: i.question.trim(),
      answer: i.answer.trim(),
    })),
  };
}