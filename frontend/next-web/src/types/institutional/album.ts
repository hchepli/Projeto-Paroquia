// Álbum de fotos da galeria (RF014). RN003: um álbum pode estar
// vinculado a um evento (eventId preenchido) ou ser um grupo de fotos
// avulso, sem evento (eventId null).
//
// NOTA DE ALINHAMENTO COM O SCHEMA (schema_modelagem_mysql):
// - A tabela `albuns` não possui coluna `coverUrl`. A capa é derivada da
//   foto marcada como `is_capa = true` (constraint `uq_fotos_capa_por_album`
//   garante no máximo 1 capa por álbum). Por isso `coverUrl` foi removido
//   deste tipo e passou a ser calculado no service a partir de `Photo`.
// - A tabela `albuns` também não possui coluna `slug`, diferente de
//   `eventos.slug`. Mantivemos `slug` aqui pois a rota pública
//   /galeria/[slug] já depende dele — fica como pendência para o backend
//   (sugestão: adicionar `slug VARCHAR(180) UNIQUE` em `albuns`, igual ao
//   padrão já usado em `eventos`). Enquanto não for confirmado, o service
//   segue gerando/usando o slug do mock normalmente.
export interface Album {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  eventId: string | null;
}

export type CreateAlbumInput = Omit<Album, "id">;

export type UpdateAlbumInput = Partial<CreateAlbumInput>;