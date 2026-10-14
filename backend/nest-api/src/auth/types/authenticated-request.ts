import type { Request } from 'express';

// Formato devolvido pela JwtStrategy.validate()
export interface AuthUser {
  userId: string;
  email: string;
  roleId: number;
  roleName: string;
  pastoralGroupId: number | null;
}

export type AuthenticatedRequest = Request & { user: AuthUser };

// req.user depois do LocalAuthGuard (só o necessário para emitir o token)
export type LoginRequest = Request & { user: { id: string; email: string } };