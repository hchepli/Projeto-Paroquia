// src/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { NormalizeEmail } from '../../common/decorators/normalize-email.decorator';

export class LoginDto {
  @ApiProperty({ example: 'secretaria@paroquia.org' })
  @NormalizeEmail() // mesmo tratamento do CreateUserDto
  @IsEmail()
  @MaxLength(180)
  email!: string;

  // Teto evita mandar strings gigantes ao bcrypt.
  // Sem StrongPassword de propósito: no login não validamos a política, só o formato.
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
