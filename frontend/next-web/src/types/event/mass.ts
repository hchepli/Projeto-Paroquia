export type MassType = "comum" | "especial";

export interface Mass {
  id: string;
  title: string;
  dateTime: string; // ISO date string
  type: MassType;
  location: string | null;
  notes: string | null;
}

export type CreateMassInput = Omit<Mass, "id">;

export type UpdateMassInput = Partial<CreateMassInput>;