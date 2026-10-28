// src/types/sacraments/sacraments.ts
export interface SacramentFaqItem {
  question: string;
  answer: string;
}

export interface Sacrament {
  id: number;
  name: string;
  slug: string;
  description: string;
  requiredDocuments: string | null;
  faq: SacramentFaqItem[] | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Corpo do POST /sacraments (e base do PATCH).
export interface SacramentPayload {
  name: string;
  slug?: string;
  description: string;
  requiredDocuments?: string;
  faq?: SacramentFaqItem[];
  displayOrder?: number;
}

export type UpdateSacramentInput = Partial<SacramentPayload> & { id: number };
