import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

// DTO de atribuição para uso ANINHADO dentro de CreateScheduleDto.
// Sem scheduleId: o vínculo é resolvido pelo service a partir da
// Schedule recém-criada, não informado pelo cliente.
export class CreateNestedScheduleAssignmentDto {
  @ApiProperty({ example: 1, description: 'ID do voluntário' })
  @IsInt()
  volunteerId!: number;

  @ApiProperty({
    example: 'leitor',
    description:
      'Função na escala (texto livre no schema — ex: leitor, ministro_eucaristia, coroinha)',
  })
  @IsString()
  role!: string;
}