export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  roleId: number;
  role?: { id: number; name: string };
  pastoralGroupId: number | null;
  pastoralGroup?: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
}