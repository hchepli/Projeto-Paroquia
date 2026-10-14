export interface Pastoral {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  contact: string | null;
}

export type CreatePastoralInput = Omit<Pastoral, "id">;

export type UpdatePastoralInput = Partial<CreatePastoralInput>;