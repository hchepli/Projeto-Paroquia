import { Photo } from "@/types/institutional/photo";

// Fotos agora pertencem a um Álbum (albumId), não diretamente a um evento
// (ver types/institutional/album.ts e a atualização de RN03 combinada no
// chat: um álbum pode ou não estar vinculado a um evento).
export const photoMock: Photo[] = [
  {
    id: "photo-1",
    albumId: "album-1",
    url: "/img/hero/eventos-img.png",
    description: "Capa da Festa de Natal",
    isCover: true,
  },
  {
    id: "photo-2",
    albumId: "album-2",
    url: "/img/hero/vespera-ano-novo.png",
    description: "Capa da Véspera de Ano Novo",
    isCover: true,
  },
  // Fotos avulsas migradas do grid antigo de /galeria (public/img/galeria/*),
  // agora organizadas em álbuns sem evento vinculado.
  {
    id: "photo-3",
    albumId: "album-3",
    url: "/img/galeria/1.png",
    description: "Encontro de jovens",
    isCover: true,
  },
  {
    id: "photo-4",
    albumId: "album-3",
    url: "/img/galeria/2.png",
    description: "Procissão",
    isCover: false,
  },
  {
    id: "photo-5",
    albumId: "album-3",
    url: "/img/galeria/4.png",
    description: "Batizado",
    isCover: false,
  },
  {
    id: "photo-6",
    albumId: "album-3",
    url: "/img/galeria/6.png",
    description: "Comunidade reunida",
    isCover: false,
  },
  {
    id: "photo-7",
    albumId: "album-4",
    url: "/img/galeria/3.png",
    description: "Celebração",
    isCover: true,
  },
  {
    id: "photo-8",
    albumId: "album-4",
    url: "/img/galeria/5.png",
    description: "Missa dominical",
    isCover: false,
  },
  {
    id: "photo-9",
    albumId: "album-4",
    url: "/img/galeria/7.png",
    description: "Celebração no altar",
    isCover: false,
  },
];
