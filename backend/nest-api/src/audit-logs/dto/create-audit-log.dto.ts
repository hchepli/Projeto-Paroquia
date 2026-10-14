import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { AuditAction } from '../../../generated/prisma/client';

// Preenchido internamente pelo sistema (interceptor, etapa futura do roadmap),
// não por request manual do usuário. Mantido como CRUD padrão por ora, mas na
// prática esse endpoint deve ficar restrito/read-only quando o RBAC entrar.
export class CreateAuditLogDto {
    @ApiProperty({
        description: 'ID do usuário que realizou a ação (UUID)',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    @IsString()
    @IsNotEmpty()
    userId!: string;

    @ApiProperty({
        description: 'Ação realizada',
        enum: AuditAction,
        example: AuditAction.CREATE,
    })
    @IsEnum(AuditAction)
    @IsNotEmpty()
    action!: AuditAction;

    @ApiProperty({
        description: 'Nome da entidade afetada pela ação',
        example: 'Category',
        maxLength: 80,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(80)
    entity!: string;

    @ApiProperty({
        description: 'ID da entidade afetada',
        example: '1',
        maxLength: 36,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(36)
    entityId!: string;

    @ApiPropertyOptional({
        description: 'Dados anteriores à ação (JSON)',
        example: { name: 'Categoria de Teste', type: 'EVENT' },
    })
    @IsOptional()
    previousData?: any;

    @ApiPropertyOptional({
        description: 'Dados posteriores à ação (JSON)',
        example: { name: 'Categoria de Teste Atualizada', type: 'EVENT' },
    })
    @IsOptional()
    newData?: any;
}