import { PartialType } from '@nestjs/swagger'; // IMPORTANTE: de @nestjs/swagger, não de @nestjs/mapped-types
import { CreateRoleDto } from './create-role.dto';

// PartialType pega o CreateRoleDto e transforma TODOS os campos em opcionais
// (equivalente a, no DRF, criar um serializer com partial=True para PATCH).
// A diferença de usar o PartialType do @nestjs/swagger (em vez do @nestjs/mapped-types)
// é que ele também copia os metadados do @ApiProperty pro Swagger, então o schema
// de UpdateRoleDto aparece certinho na doc em vez de vir vazio.
export class UpdateRoleDto extends PartialType(CreateRoleDto) {}