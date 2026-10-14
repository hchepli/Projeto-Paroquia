export interface Volunteer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export type CreateVolunteerInput = Omit<Volunteer, "id">;

export type UpdateVolunteerInput = Partial<CreateVolunteerInput>;