export interface Album {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  eventId: number | null;
  createdAt: string;
  updatedAt: string;
}
