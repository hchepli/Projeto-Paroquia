import { albumMock } from "@/data/institutional/album";
import { photoMock } from "@/data/photo/photo";
import { Album } from "@/types/institutional/album";
import { AlbumDetail, AlbumListItem } from "@/types/institutional/albumListItem";

const DELAY_MS = 300;
const FALLBACK_IMAGE = "/img/hero/eventos-img.png";

function getPhotosForAlbum(album: Album) {
  return photoMock.filter((photo) => photo.albumId === album.id);
}

// Retorna todos os álbuns que já têm ao menos uma foto, para a página
// /galeria (grid de álbuns). Álbuns sem fotos ainda não aparecem na
// listagem (nada pra mostrar).
// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch("/api/galeria");
// return response.json();
export async function getAllAlbums(): Promise<AlbumListItem[]> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  return albumMock
    .map((album) => {
      const photos = getPhotosForAlbum(album);
      // Capa = foto com isCover true (espelha fotos.is_capa +
      // constraint uq_fotos_capa_por_album no schema). Sem capa marcada,
      // cai para a primeira foto do álbum e, por último, para um fallback fixo.
      const cover = photos.find((photo) => photo.isCover) ?? photos[0];
      return {
        id: album.id,
        slug: album.slug,
        title: album.title,
        description: album.description ?? "",
        coverUrl: cover?.url ?? FALLBACK_IMAGE,
        photoCount: photos.length,
        hasEvent: album.eventId !== null,
      };
    })
    .filter((album) => album.photoCount > 0);
}

// Retorna o detalhe de um álbum (com todas as fotos) para a página
// /galeria/[slug]. O álbum pode ou não estar vinculado a um evento
// (ver Album.eventId) — quando não está, o título/descrição usados são
// os do próprio álbum.
// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch(`/api/galeria/${slug}`);
// if (!response.ok) return null;
// return response.json();
export async function getAlbumDetail(slug: string): Promise<AlbumDetail | null> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  const album = albumMock.find((a) => a.slug === slug);
  if (!album) return null;

  const photos = getPhotosForAlbum(album);

  return {
    id: album.id,
    slug: album.slug,
    title: album.title,
    description: album.description ?? "",
    hasEvent: album.eventId !== null,
    photos: photos.map((photo) => ({
      id: photo.id,
      url: photo.url,
      description: photo.description,
    })),
  };
}