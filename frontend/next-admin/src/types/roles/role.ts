export interface Role {
  id: number;
  name: string;
  description: string | null;
  isBase: boolean;
  _count: { users: number };
}

export interface RoleInput {
  name?: string;
  description?: string;
}