// src/types/users/update-user.ts
import { UserStatus } from './user';

export interface UpdateUserInput {
  name?: string;
  email?: string;
  roleId?: number;
  pastoralGroupId?: number | null;
  status?: UserStatus;
}