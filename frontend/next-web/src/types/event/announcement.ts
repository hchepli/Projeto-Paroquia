import { User } from "../user/user";

// Espelha o ENUM("RASCUNHO", "PUBLICADO") da coluna comunicados.status no schema.
// Sem esse campo o front não tinha como distinguir rascunho de publicado -
// o site institucional deve exibir apenas comunicados com status PUBLICADO.
export type AnnouncementStatus = "RASCUNHO" | "PUBLICADO";

// ATENÇÃO (gap schema x front): a tabela `comunicados` não possui coluna `slug`
// (apenas id, titulo, conteudo, categoria/categoria_id, status, imagem_url, autor_id).
// O front usa slug nas rotas (/comunicados/[slug]) para URLs amigáveis/SEO (RNF014).
// Enquanto não há decisão definitiva, o slug aqui é derivado do título no mock/service.
// Recomendação a confirmar: adicionar coluna `slug VARCHAR(180) UNIQUE` em `comunicados`
// (mesmo padrão já usado em `eventos`), gerada no backend a partir do título.
export interface Announcement {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string; // hoje texto livre; schema já prevê categoria_id -> tabela categorias (migração em aberto)
  status: AnnouncementStatus;
  image: string | null; // imagem própria do comunicado (coluna "imagem_url" na tabela comunicados)
  authorId: string | null;
  author?: User; // populado quando a API fizer join/include
  publishedAt: string; // ISO date string (hoje mapeado a partir de created_at, ver observação no service)
}

export type CreateAnnouncementInput = Omit<Announcement, "id" | "author" | "publishedAt">;

export type UpdateAnnouncementInput = Partial<CreateAnnouncementInput>;