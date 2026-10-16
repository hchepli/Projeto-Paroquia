// src/types/events/events.ts
export type EventStatus = 'ACTIVE' | 'CANCELLED';

export interface PastoralGroupSummary {
  id: number;
  name: string;
}

/** Formato real da API: pastoralGroups[{ pastoralGroup: { id, name } }]. */
export interface EventPastoralGroupLink {
  pastoralGroup: PastoralGroupSummary;
}

/** Item de lista / retorno público (GET /events, GET /events/slug/:slug). */
export interface Event {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  startDate: string; // ISO 8601
  endDate?: string | null;
  location: string;
  category?: { id: number; name: string } | null;
  pastoralGroups?: EventPastoralGroupLink[];
}

/** Retorno de GET /events/admin e /events/admin/:id. */
export interface AdminEvent extends Event {
  status: EventStatus;
  massId?: number | null;
  categoryId?: number | null;
  createdAt: string;
  updatedAt: string;
  // Só no detalhe:
  mass?: { id: number; title: string; dateTime: string } | null;
  albums?: { id: number; title: string; slug: string }[];
  // Só vem para Admin Geral/Secretaria.
  _count?: { attendanceConfirmations: number };
}

export interface EventDeleteResult {
  id: number;
  name: string;
  removedSchedules: number;
  removedAttendanceConfirmations: number;
  unlinkedAlbums: number;
}