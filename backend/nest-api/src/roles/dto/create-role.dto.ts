import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

// Equivalente ao "model Role" do schema.prisma (tabela `cargos` no SQL de referência).
// Aqui descrevemos apenas os campos que o CLIENTE pode enviar na criação.
// Campos como `id`, `createdAt`, `updatedAt` nunca entram no DTO de create,
// pois são gerados pelo banco/Prisma.
export class CreateRoleDto {
  @ApiProperty({
    description: 'Nome do cargo (ex: Admin Geral, Secretaria, Coordenador de Pastoral)',
    example: 'Secretaria',
    maxLength: 60,
  })
  @IsString()
  @IsNotEmpty() // impede string vazia "" (diferente de @IsOptional, que impede campo ausente/undefined)
  @MaxLength(60)
  name!: string;

  @ApiPropertyOptional({
    description: 'Descrição livre sobre o cargo e suas responsabilidades',
    example: 'Gestão de comunicados, eventos, missas, calendário, sacramentos e galeria.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  // isBase (RN005 — indica se é um dos 3 cargos-base do sistema) é uma flag
  // de controle interno, não algo que o cliente deve poder setar na criação.
  // Por isso NÃO aparece aqui — se um dia precisar, o service que decide,
  // nunca o DTO recebendo do body.
}