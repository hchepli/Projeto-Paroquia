import { Album } from "@/types/institutional/album";

// coverUrl não existe mais aqui (ver nota em types/institutional/album.ts) —
// a capa de cada álbum é a foto marcada com isCover: true em data/photo/photo.ts.
export const albumMock: Album[] = [
  {
    id: "album-1",
    slug: "festa-de-natal",
    title: "Festa de Natal",
    description: "Fotos da celebração de Natal da nossa comunidade.",
    eventId: "event-5",
  },
  {
    id: "album-2",
    slug: "vespera-de-ano-novo",
    title: "Véspera de Ano Novo",
    description: "Fotos da nossa véspera de Ano Novo, celebrada em comunidade.",
    eventId: "event-6",
  },
  {
    id: "album-3",
    slug: "comunidade-em-imagens",
    title: "Comunidade em Imagens",
    description: "Momentos do dia a dia da paróquia, sem um evento específico associado.",
    eventId: null,
  },
  {
    id: "album-4",
    slug: "celebracoes-e-liturgia",
    title: "Celebrações e Liturgia",
    description: "Registros de missas e celebrações realizadas ao longo do ano.",
    eventId: null,
  },
];