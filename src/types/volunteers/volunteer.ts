// src/types/volunteers/volunteer.ts
export interface Volunteer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  pastoralGroupId: number;
  pastoralGroup?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}
