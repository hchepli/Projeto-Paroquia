import { Mass } from "./mass";

// Espelha o ENUM("ATIVO", "CANCELADO") da coluna eventos.status no schema.
export type EventRecordStatus = "ATIVO" | "CANCELADO";

export interface Event {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string; // ex: "Festa", "Missa Especial", "Encontro de Pastoral"
  status: EventRecordStatus;
  startDate: string; // ISO date string
  endDate: string | null;
  location: string | null;
  massId: string | null; // opcional: evento pode estar ligado a uma missa
  mass?: Mass; // populado quando a API fizer join/include
}

export type CreateEventInput = Omit<Event, "id" | "mass">;

export type UpdateEventInput = Partial<CreateEventInput>;