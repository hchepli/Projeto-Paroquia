import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

// Única alteração permitida via PATCH: marcar a foto como capa.
// A `url` NÃO pode mais ser trocada (só o upload gera URL), e `albumId`
// também não muda (RN010 — uma Foto pertence a exatamente um Álbum).
export class UpdatePhotoDto {
  @ApiProperty({
    description:
      'Marcar a foto como capa do álbum. Só aceita `true`: para trocar a capa, marque outra foto (a anterior é desmarcada automaticamente — RN010).',
    example: true,
  })
  @IsBoolean()
  isCover!: boolean;
}
