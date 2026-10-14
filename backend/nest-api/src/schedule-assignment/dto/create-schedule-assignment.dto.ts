import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateScheduleAssignmentDto {
    @ApiProperty({
        description: 'ID da Escala (UUID)',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    @IsUUID()
    @IsNotEmpty()
    scheduleId!: string;

    @ApiProperty({
        description: 'ID do Voluntário',
        example: 1,
    })
    @IsInt()
    @IsNotEmpty()
    volunteerId!: number;

    @ApiProperty({
        description: 'Função exercida na escala (texto livre por enquanto — ex: leitor, ministro_eucaristia, coroinha). Confirmar se deve virar @IsEnum futuramente.',
        example: 'leitor',
        maxLength: 80,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(80)
    role!: string;
}