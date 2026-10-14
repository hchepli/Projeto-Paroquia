import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsInt } from 'class-validator';

export class CreateAttendanceConfirmationDto {
    @ApiProperty({
        description: 'Nome do participante',
        example: 'João da Silva',
        maxLength: 150,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name!: string;

    @ApiProperty({
        description: 'Contato do participante (telefone ou email)',
        example: 'joao.silva@example.com ou (47) 99999-0000',
        maxLength: 150,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    contact!: string;

    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    eventId!: number;

    // ipAddress NÃO entra no DTO do body — é capturado do request
    // (req.ip) pelo service/controller, não enviado pelo cliente.
    // Rate limiting (RNF017) é outra etapa do roadmap.
}