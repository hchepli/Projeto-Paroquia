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