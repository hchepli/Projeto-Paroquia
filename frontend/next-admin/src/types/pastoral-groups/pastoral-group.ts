// src/types/pastoral-groups/pastoral-group.ts
export interface PastoralGroup {
  id: number;
  name: string;
  description?: string | null;
  contact?: string | null;
  defaultRole?: string | null;
}
