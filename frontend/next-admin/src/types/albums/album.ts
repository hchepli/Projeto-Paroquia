export interface Album {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  eventId: number | null;
  createdAt: string;
  updatedAt: string;
  // Agregados: só vêm em GET /albums (lista). Em GET /albums/:id ficam ausentes.
  eventName?: string | null;
  photoCount?: number;
  coverUrl?: string | null;
}