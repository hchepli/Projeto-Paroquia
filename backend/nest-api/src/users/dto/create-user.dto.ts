// src/users/dto/create-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { NormalizeEmail } from '../../common/decorators/normalize-email.decorator';
import { StrongPassword } from '../../common/decorators/strong-password.decorator';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome do usuário', example: 'Usuário de Teste', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ description: 'E-mail (normalizado para minúsculas)', example: 'usuario@teste.com', maxLength: 180 })
  @NormalizeEmail()
  @IsEmail()
  @MaxLength(180) // coluna é VarChar(180)
  email!: string;

  @ApiProperty({
    description: 'Senha: 8 a 72 caracteres, com ao menos 1 letra e 1 número. O hash é gerado no service.',
    example: 'senhaForte123',
    minLength: 8,
    maxLength: 72,
  })
  @StrongPassword()
  password!: string;

  @ApiProperty({ description: 'ID do Cargo (Role)', example: 1 })
  @IsInt()
  roleId!: number;

  @ApiPropertyOptional({
    description: 'Obrigatório se o cargo for "Coordenador de Pastoral"; proibido para os demais (RN006).',
  })
  @IsOptional()
  @IsInt()
  pastoralGroupId?: number;
}