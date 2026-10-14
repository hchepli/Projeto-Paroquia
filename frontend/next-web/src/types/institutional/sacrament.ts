export interface Sacrament {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  requiredDocuments: string | null;
  displayOrder: number;
}

export type CreateSacramentInput = Omit<Sacrament, "id">;

export type UpdateSacramentInput = Partial<CreateSacramentInput>;

// FAQ do sacramento — assim como no evento, não é um requisito formal do
// RF07 ainda; adicionado como complemento simples da página de detalhe.
export interface SacramentFaqItem {
  question: string;
  answer: string;
}

// Modelo usado pela página de detalhe (/sacramentos/[slug]).
export interface SacramentDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  requiredDocuments: string[];
  faq: SacramentFaqItem[];
  whatsappHref: string;
}