// src/types/users/user.ts
export type UserStatus = 'ATIVO' | 'INATIVO';

export interface User {
  id: string; // UUID
  name: string;
  email: string;
  status: UserStatus;
  roleId: number;
  role?: {
    id: number;
    name: string;
  };
  pastoralGroupId: number | null;
  pastoralGroup?: {
    id: number;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}