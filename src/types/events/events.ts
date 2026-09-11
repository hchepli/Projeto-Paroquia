export type EventStatus = 'ACTIVE' | 'CANCELLED';

export interface Event {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  categoryId?: number | null;
  startDate: string; // ISO 8601
  endDate?: string | null;
  location: string;
  status: EventStatus;
  massId?: number | null;
  createdAt: string;
  updatedAt: string;
}