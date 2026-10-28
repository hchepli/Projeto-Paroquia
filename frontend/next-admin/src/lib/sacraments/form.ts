// src/lib/sacraments/form.ts
import { getFriendlyErrorMessage } from '@/lib/errors';
import { ApiError } from '@/lib/sacraments/api';
import { Sacrament, SacramentFaqItem, SacramentPayload } from '@/types/sacraments/sacraments';

export interface SacramentFormValues {
  name: string;
  slug: string;
  description: string;
  requiredDocuments: string;
  faq: SacramentFaqItem[];
}

export const EMPTY_SACRAMENT_FORM: SacramentFormValues = {
  name: '',
  slug: '',
  description: '',
  requiredDocuments: '',
  faq: [],
};

// Limites espelham o DTO do back (create-sacrament.dto.ts).
export const SACRAMENT_LIMITS = {
  name: 120,
  slug: 180,
  description: 5000,
  requiredDocuments: 3000,
  faqItems: 30,
  question: 300,
  answer: 2000,
};

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function sacramentToFormValues(s: Sacrament): SacramentFormValues {
  return {
    name: s.name,
    slug: s.slug,
    description: s.description,
    requiredDocuments: s.requiredDocuments ?? '',
    faq: (s.faq ?? []).map((i) => ({ question: i.question, answer: i.answer })),
  };
}

// Linhas de FAQ totalmente vazias são ignoradas; meio preenchidas são erro.
function filledFaq(faq: SacramentFaqItem[]) {
  return faq.filter((i) => i.question.trim() || i.answer.trim());
}

export function validateSacramentForm(v: SacramentFormValues): string | null {
  const L = SACRAMENT_LIMITS;
  if (!v.name.trim()) return 'Informe o nome do sacramento.';
  if (v.name.trim().length > L.name) return `O nome deve ter no máximo ${L.name} caracteres.`;

  const slug = v.slug.trim();
  if (slug && !SLUG_REGEX.test(slug)) {
    return 'O slug deve ter apenas letras minúsculas, números e hífens (ex.: primeira-eucaristia).';
  }
  if (slug.length > L.slug) return `O slug deve ter no máximo ${L.slug} caracteres.`;

  if (!v.description.trim()) return 'Informe a descrição.';
  if (v.description.trim().length > L.description) {
    return `A descrição deve ter no máximo ${L.description} caracteres.`;
  }
  if (v.requiredDocuments.trim().length > L.requiredDocuments) {
    return `Os documentos necessários devem ter no máximo ${L.requiredDocuments} caracteres.`;
  }

  const faq = filledFaq(v.faq);
  if (faq.length > L.faqItems) return `No máximo ${L.faqItems} perguntas frequentes.`;
  for (const [i, item] of faq.entries()) {
    if (!item.question.trim() || !item.answer.trim()) {
      return `Pergunta frequente ${i + 1}: preencha a pergunta e a resposta (ou remova a linha).`;
    }
    if (item.question.trim().length > L.question) {
      return `Pergunta frequente ${i + 1}: pergunta com mais de ${L.question} caracteres.`;
    }
    if (item.answer.trim().length > L.answer) {
      return `Pergunta frequente ${i + 1}: resposta com mais de ${L.answer} caracteres.`;
    }
  }
  return null;
}

export function buildSacramentPayload(
  v: SacramentFormValues,
  mode: 'create' | 'edit',
): SacramentPayload {
  const slug = v.slug.trim();
  return {
    name: v.name.trim(),
    // slug vazio: não envia (o back gera). Enviar '' daria 400.
    ...(slug ? { slug } : {}),
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

export function getSacramentSaveError(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.status === 409) {
    return 'Já existe um sacramento com esse slug. Altere o nome ou informe outro slug.';
  }
  return getFriendlyErrorMessage(err, fallback);
}
