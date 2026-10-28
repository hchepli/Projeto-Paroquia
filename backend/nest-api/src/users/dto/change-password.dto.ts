// src/users/dto/change-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { StrongPassword } from '../../common/decorators/strong-password.decorator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Nova senha: 8 a 72 caracteres, ao menos 1 letra e 1 número',
    minLength: 8,
    maxLength: 72,
  })
  @StrongPassword()
  newPassword!: string;
}
