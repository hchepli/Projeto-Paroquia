import { SacramentFaqItem } from "@/types/institutional/sacrament";

// FAQ por sacramento — mock, mesmo padrão do eventFaq.ts. Fica fixo por
// enquanto; se o admin passar a gerenciar isso, vira CRUD (RF07).
const defaultFaq: SacramentFaqItem[] = [
  {
    question: "Como faço para agendar?",
    answer: "Entre em contato com a secretaria paroquial para agendar uma data e horário.",
  },
  {
    question: "Preciso fazer alguma preparação antes?",
    answer: "Sim, normalmente há um período de preparação com encontros. A secretaria informa os detalhes.",
  },
];

export const sacramentFaqMock: Record<string, SacramentFaqItem[]> = {
  batismo: [
    {
      question: "Qual a idade mínima ou máxima para batizar?",
      answer: "Não há idade mínima ou máxima — batizamos desde bebês até adultos.",
    },
    ...defaultFaq,
  ],
  casamento: [
    {
      question: "Com quanto tempo de antecedência devo agendar o casamento?",
      answer: "Recomendamos procurar a secretaria com pelo menos 6 meses de antecedência.",
    },
    ...defaultFaq,
  ],
};

export function getSacramentFaq(slug: string): SacramentFaqItem[] {
  return sacramentFaqMock[slug] ?? defaultFaq;
}
