// src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Formato definido pela JwtStrategy.validate()
export interface AuthUser {
  userId: string;
  email: string;
  roleId: number;
  roleName: string;
  pastoralGroupId: number | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest().user,
);