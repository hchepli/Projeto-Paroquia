export type EventStatus = 'ACTIVE' | 'CANCELLED';

export interface PastoralGroupSummary {
  id: number;
  name: string;
}

export interface EventPastoralGroupLink {
  eventId: number;
  pastoralGroupId: number;
  pastoralGroup: PastoralGroupSummary;
}

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
  // Só presente no retorno de GET /events/:id (findOne faz include);
  // ausente na listagem (GET /events, sem include).
  pastoralGroups?: EventPastoralGroupLink[];
}