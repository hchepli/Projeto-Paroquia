import { EventRecordStatus } from "./event";

export type EventStatus = "past" | "today" | "future";

export interface EventListItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  location: string;
  startDate: string; // ISO date string
  endDate: string | null;
  image: string;
  status: EventStatus;
}

// FAQ do evento — não faz parte do RF05 original; adicionado como
// complemento simples para a página de detalhe. Estrutura de dados
// definitiva (mock vs. cadastrável no admin) ainda em aberto.
export interface EventFaqItem {
  question: string;
  answer: string;
}

export interface EventPhotoItem {
  id: string;
  url: string;
  description: string | null;
}

// Modelo usado pela página de detalhe (/eventos/[id]).
// Reaproveita os mesmos campos do EventListItem e adiciona o que é
// específico da página de detalhe (fotos da galeria vinculadas ao
// evento - RF08 - e FAQ).
export interface EventDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  location: string;
  startDate: string;
  endDate: string | null;
  image: string;
  status: EventStatus; // calculado (passado/hoje/futuro) a partir das datas
  recordStatus: EventRecordStatus; // ATIVO/CANCELADO (coluna eventos.status no schema)
  gallery: EventPhotoItem[];
  faq: EventFaqItem[];
  whatsappHref: string;
}