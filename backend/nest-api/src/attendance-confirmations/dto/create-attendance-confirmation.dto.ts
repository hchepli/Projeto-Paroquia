import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsPositive, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { IsContact } from '../../common/validators/is-contact.validator';

export class CreateAttendanceConfirmationDto {
  @ApiProperty({ description: 'Nome do participante', example: 'João da Silva', maxLength: 150 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  @Matches(/^[^<>]*$/, { message: 'O nome contém caracteres inválidos.' }) // RNF006
  name!: string;

  @ApiProperty({
    description: 'E-mail ou telefone com DDD. É normalizado (e-mail minúsculo; telefone só dígitos, sem +55).',
    example: 'joao.silva@example.com ou (47) 99999-0000',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @IsContact()
  contact!: string;

  @ApiProperty({ description: 'Evento em que a presença será registrada' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  eventId!: number;

  // ipAddress NÃO vem do body: o controller captura de req.ip (RNF017).
}
