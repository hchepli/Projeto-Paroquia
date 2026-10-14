import { eventMock } from "@/data/event/event";
import { photoMock } from "@/data/photo/photo";
import { albumMock } from "@/data/institutional/album";
import { getEventFaq } from "@/data/event/eventFaq";
import { contactInfoMock } from "@/data/institutional/contactInfo";
import { EventSlide } from "@/types/event/eventSlide";
import { EventDetail, EventListItem, EventStatus } from "@/types/event/eventListItem";

const DELAY_MS = 300;
const FALLBACK_IMAGE = "/img/hero/eventos-img.png";

// Fotos de um evento agora passam pelo Álbum vinculado a ele (Photo não
// referencia mais eventId diretamente - ver types/institutional/album.ts).
// Um evento pode não ter álbum algum (ainda não fotografado).
function getPhotosForEvent(eventId: string) {
  const album = albumMock.find((a) => a.eventId === eventId);
  if (!album) return [];
  return photoMock.filter((photo) => photo.albumId === album.id);
}

// Monta o link de WhatsApp usado no CTA "Garantir Vaga" da página de
// detalhe do evento, reaproveitando o número já cadastrado em
// contactInfoMock (mesmo usado na página de Contato).
function buildEventWhatsappHref(eventName: string): string {
  const baseNumber = contactInfoMock.whatsappHref.split("?")[0];
  const message = `Olá! Gostaria de garantir minha vaga no evento "${eventName}".`;
  return `${baseNumber}?text=${encodeURIComponent(message)}`;
}

function getEventStatus(startDate: string, endDate: string | null): EventStatus {
  const now = new Date();
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (isSameDay(start, now) || (now >= start && now <= end)) return "today";
  if (end < now) return "past";
  return "future";
}

// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch("/api/home/upcoming-events");
// return response.json();
export async function getUpcomingEventSlides(): Promise<EventSlide[]> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  const now = new Date();

  return eventMock
    // status ATIVO (eventos.status no schema) - eventos cancelados não aparecem na Home
    .filter((event) => event.status === "ATIVO" && new Date(event.startDate) >= now)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((event) => {
      const cover = getPhotosForEvent(event.id).find((photo) => photo.isCover);
      return {
        id: event.id,
        slug: event.slug,
        image: cover?.url ?? FALLBACK_IMAGE,
        titleLines: [event.name.toUpperCase()],
        description: event.description ?? "",
        cardTitle: event.name,
        cardDescription: event.description ?? "",
      };
    });
}

// Retorna todos os eventos (passados e futuros) para a página /eventos,
// já com imagem de capa resolvida e status calculado (passado/hoje/futuro),
// ordenados cronologicamente (mais antigo -> mais recente) para agrupar por mês no front.
// Alinhamento com schema: eventos.status (ATIVO/CANCELADO) é campo de gestão do
// admin (evento cancelado sem precisar excluir o registro nem as escalas vinculadas).
// Evento CANCELADO não deve aparecer na listagem pública (mesma regra já aplicada
// em getUpcomingEventSlides, que faltava aqui).
// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch("/api/eventos?status=ATIVO");
// return response.json();
export async function getAllEventsWithStatus(): Promise<EventListItem[]> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  return [...eventMock]
    .filter((event) => event.status === "ATIVO")
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((event) => {
      const cover = getPhotosForEvent(event.id).find((photo) => photo.isCover);
      return {
        id: event.id,
        slug: event.slug,
        name: event.name,
        description: event.description ?? "",
        category: event.category,
        location: event.location ?? "Local a confirmar",
        startDate: event.startDate,
        endDate: event.endDate,
        image: cover?.url ?? FALLBACK_IMAGE,
        status: getEventStatus(event.startDate, event.endDate),
      };
    });
}

// Retorna o detalhe de um evento específico para a página /eventos/[slug],
// incluindo a galeria de fotos vinculadas a ele (RF08 - fotos associadas
// a um evento específico, ver RN03), o FAQ do evento e o link de WhatsApp
// pronto para o CTA "Garantir Vaga" (reaproveita o número já cadastrado
// em contactInfoMock).
// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch(`/api/eventos/${slug}`);
// if (!response.ok) return null;
// return response.json();
export async function getEventDetail(slug: string): Promise<EventDetail | null> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  const event = eventMock.find((e) => e.slug === slug);
  if (!event) return null;

  const photos = getPhotosForEvent(event.id);
  const cover = photos.find((photo) => photo.isCover);

  return {
    id: event.id,
    slug: event.slug,
    name: event.name,
    description: event.description ?? "",
    category: event.category,
    location: event.location ?? "Local a confirmar",
    startDate: event.startDate,
    endDate: event.endDate,
    image: cover?.url ?? FALLBACK_IMAGE,
    status: getEventStatus(event.startDate, event.endDate),
    // Diferente da listagem (que esconde CANCELADO), no detalhe mantemos acessível
    // (evita link quebrado se já foi compartilhado) e sinalizamos via recordStatus,
    // exibido como aviso na página.
    recordStatus: event.status,
    gallery: photos.map((photo) => ({
      id: photo.id,
      url: photo.url,
      description: photo.description,
    })),
    faq: getEventFaq(event.slug),
    whatsappHref: buildEventWhatsappHref(event.name),
  };
}