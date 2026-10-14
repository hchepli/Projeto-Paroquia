// src/types/volunteers/update-volunteer.ts
export interface UpdateVolunteerInput {
  name?: string;
  phone?: string;
  email?: string | null;
  pastoralGroupId?: number;
}