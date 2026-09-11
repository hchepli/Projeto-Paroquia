export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  slug: string;
  categoryId: number | null;
  status: AnnouncementStatus;
  imageUrl: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}
