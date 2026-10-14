// src/users/dto/update-user.dto.ts
import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UserStatus } from '../../../generated/prisma/client';

// Senha NÃO é editável aqui: use PATCH /users/:id/password (UC002)
export class UpdateUserDto extends OmitType(PartialType(CreateUserDto), ['password'] as const) {
  @ApiPropertyOptional({ enum: UserStatus, description: 'ACTIVE | INACTIVE' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}