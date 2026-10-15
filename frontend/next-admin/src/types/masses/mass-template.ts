// src/types/masses/mass-template.ts
import { MassType } from './masses';

export interface MassTemplate {
  id: number;
  dayOfWeek: number; // 0 (domingo) a 6 (sábado)
  time: string; // "HH:mm"
  title: string;
  location: string;
  type: MassType;
  notes?: string | null;
  active: boolean;
}

export interface CreateMassTemplatePayload {
  dayOfWeek: number;
  time: string;
  title: string;
  location: string;
  type: MassType;
  notes?: string;
}

/** PATCH não aceita dayOfWeek nem time (o back responde 400). */
export type UpdateMassTemplatePayload = Partial<
  Pick<MassTemplate, 'title' | 'location' | 'type' | 'notes' | 'active'>
>;

/** Resposta do PATCH ao desativar com ?removeFuture=true. */
export type MassTemplateUpdateResult = MassTemplate & {
  removed?: number;
  keptWithSchedule?: number;
};
