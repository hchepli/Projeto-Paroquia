import { Role } from "./role";

export interface User {
  id: string;
  name: string;
  email: string;
  // senha_hash nunca deve trafegar pro front — não incluir aqui
  roleId: string;
  role?: Role; // populado quando a API fizer join/include
  active: boolean;
  createdAt: string; // ISO date string
}

export type CreateUserInput = Omit<User, "id" | "role" | "createdAt"> & {
  password: string; // texto puro, só na criação — o hash é responsabilidade do backend
};

export type UpdateUserInput = Partial<Omit<CreateUserInput, "password">> & {
  password?: string; // opcional: só manda se for trocar a senha
};