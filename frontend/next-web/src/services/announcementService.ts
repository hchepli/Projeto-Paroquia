import { announcementMock } from "@/data/event/announcement";
import { Announcement } from "@/types/event/announcement";

const DELAY_MS = 300;
const SIDEBAR_LIMIT = 2;

function sortByPublishedAtDesc(announcements: Announcement[]): Announcement[] {
  return [...announcements].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

// Alinhamento com schema: comunicados.status (RASCUNHO/PUBLICADO) é usado pelo
// admin para preparar um comunicado antes de publicá-lo (UC024). O site público
// nunca deve exibir um RASCUNHO — esse filtro faltava e é aplicado em todas as
// consultas públicas abaixo, antes de qualquer ordenação/paginação.
function onlyPublished(announcements: Announcement[]): Announcement[] {
  return announcements.filter((announcement) => announcement.status === "PUBLICADO");
}

// "Destaque" não é uma coluna na tabela comunicados — é regra de negócio do front:
// o comunicado mais recente vira o destaque (hero) da página.
// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch("/api/comunicados?status=PUBLICADO&sort=recentes&limit=1");
// return (await response.json())[0] ?? null;
export async function getFeaturedAnnouncement(): Promise<Announcement | null> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  const sorted = sortByPublishedAtDesc(onlyPublished(announcementMock));
  return sorted[0] ?? null;
}

// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch(`/api/comunicados?status=PUBLICADO&sort=recentes&offset=1&limit=${limit}`);
// return response.json();
export async function getSidebarAnnouncements(
  limit: number = SIDEBAR_LIMIT
): Promise<Announcement[]> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  const sorted = sortByPublishedAtDesc(onlyPublished(announcementMock));
  return sorted.slice(1, 1 + limit);
}

// Retorna todos os comunicados restantes (após destaque + sidebar), sem limite —
// a paginação de quantos aparecem por vez é feita no front (grid de 4 colunas no desktop).
// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch(`/api/comunicados?status=PUBLICADO&sort=recentes&offset=${1 + SIDEBAR_LIMIT}`);
// return response.json();
export async function getCarouselAnnouncements(): Promise<Announcement[]> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  const sorted = sortByPublishedAtDesc(onlyPublished(announcementMock));
  const offset = 1 + SIDEBAR_LIMIT;
  return sorted.slice(offset);
}

// Retorna um comunicado específico para a página /comunicados/[slug].
// Um RASCUNHO não deve ser acessível publicamente mesmo por link direto
// (mesmo tratamento que "não encontrado", sem vazar que o registro existe).
// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch(`/api/comunicados/${slug}`);
// if (!response.ok) return null;
// return response.json();
export async function getAnnouncementDetail(slug: string): Promise<Announcement | null> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  const announcement = announcementMock.find((item) => item.slug === slug);
  if (!announcement || announcement.status !== "PUBLICADO") return null;

  return announcement;
}