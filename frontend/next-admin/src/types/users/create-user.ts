// src/types/users/create-user.ts
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roleId: number;
  /** Só para Coordenador de Pastoral (RN006). */
  pastoralGroupId?: number | null;
}