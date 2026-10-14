import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, MaxLength } from 'class-validator';

export class CreatePermissionDto {
    @ApiProperty({
        description: 'ID do Cargo (Role)',
        example: 1,
    })
    @IsInt()
    @IsNotEmpty()
    roleId!: number;

    @ApiProperty({
        description: 'Recurso ao qual a permissão se aplica',
        example: 'missas',
        maxLength: 60,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(60)
    resource!: string;

    @ApiPropertyOptional({ description: 'Pode criar (default: false)', example: false })
    @IsBoolean()
    @IsOptional()
    canCreate?: boolean;

    @ApiPropertyOptional({ description: 'Pode editar (default: false)', example: false })
    @IsBoolean()
    @IsOptional()
    canEdit?: boolean;

    @ApiPropertyOptional({ description: 'Pode remover (default: false)', example: false })
    @IsBoolean()
    @IsOptional()
    canDelete?: boolean;

    @ApiPropertyOptional({ description: 'Pode visualizar (default: false)', example: false })
    @IsBoolean()
    @IsOptional()
    canView?: boolean;
}