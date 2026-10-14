export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export type CreateRoleInput = Omit<Role, "id">;

export type UpdateRoleInput = Partial<CreateRoleInput>;