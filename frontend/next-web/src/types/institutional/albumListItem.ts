export interface AlbumListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverUrl: string;
  photoCount: number;
  hasEvent: boolean;
}

export interface AlbumPhotoItem {
  id: string;
  url: string;
  description: string | null;
}

// Modelo usado pela página de detalhe (/galeria/[slug]).
export interface AlbumDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  hasEvent: boolean;
  photos: AlbumPhotoItem[];
}
