import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    roleId: number;
    roleName: string;
    pastoralGroupId: number | null;
  };
}