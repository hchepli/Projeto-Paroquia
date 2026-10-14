// src/types/pastoral-groups/pastoral-group-input.ts
export interface PastoralGroupInput {
  name?: string;
  description?: string | null;
  contact?: string | null;
  defaultRole?: string | null;
}