import { EventFaqItem } from "@/types/event/eventListItem";

// Mock de perguntas frequentes por evento. Não existe requisito formal
// (RF05) para FAQ ainda — adicionado como complemento da página de
// detalhe. Quando o backend existir, isso deve virar um campo
// cadastrável no admin (ou ficar fixo, a definir).
const defaultFaq: EventFaqItem[] = [
  {
    question: "Preciso me inscrever com antecedência?",
    answer:
      "Não é obrigatório, mas recomendamos confirmar presença na secretaria paroquial para organizarmos melhor o evento.",
  },
  {
    question: "O evento é aberto a todos?",
    answer: "Sim, todos os membros da comunidade e visitantes são bem-vindos.",
  },
  {
    question: "Tem estacionamento no local?",
    answer:
      "O local conta com vagas limitadas nas proximidades. Recomendamos vir cedo ou usar transporte alternativo.",
  },
];

export const eventFaqMock: Record<string, EventFaqItem[]> = {
  "festa-de-natal": [
    {
      question: "Preciso levar algum presente para o amigo secreto?",
      answer: "A participação no amigo secreto é opcional e será combinada previamente com o grupo.",
    },
    ...defaultFaq,
  ],
  "vespera-de-ano-novo": [
    {
      question: "Haverá contagem regressiva e queima de fogos?",
      answer: "Sim, teremos uma celebração especial à meia-noite antes da queima de fogos.",
    },
    ...defaultFaq,
  ],
};

export function getEventFaq(slug: string): EventFaqItem[] {
  return eventFaqMock[slug] ?? defaultFaq;
}
