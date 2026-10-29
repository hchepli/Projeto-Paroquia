import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateAlbumDto } from './create-album.dto';

// Slug não muda ao editar (URLs públicas estáveis, RNF014).
// `description` e `eventId` aceitam null (IsOptional ignora null) para
// limpar a descrição / desvincular o evento (RN003).
export class UpdateAlbumDto extends PartialType(
  OmitType(CreateAlbumDto, ['slug'] as const),
) {}