// src/types/volunteers/create-volunteer.ts
export interface CreateVolunteerInput {
  name: string;
  phone: string;
  email?: string;
  pastoralGroupId: number;
}
