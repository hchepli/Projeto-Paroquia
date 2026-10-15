// src/types/masses/masses.ts
export type MassType = 'COMMON' | 'SPECIAL';

/** Formato das leituras de Missa (GET /masses, /masses/:id). */
export interface Mass {
  id: number;
  title: string;
  dateTime: string; // ISO 8601
  type: MassType;
  location: string;
  notes?: string | null;
}

/** Detalhe (GET /masses/:id): inclui as Pastorais vinculadas. */
export interface MassDetail extends Mass {
  pastoralGroups?: { pastoralGroup: { id: number; name: string } }[];
}

export interface CreateMassInput {
  title: string;
  dateTime: string; // ISO com fuso
  type: MassType;
  location: string;
  notes?: string;
  pastoralGroupIds?: number[];
}

/** PATCH: campo omitido = não altera; pastoralGroupIds [] = remove todas. */
export type UpdateMassInput = Partial<CreateMassInput>;

export interface MassScheduleConflict {
  id: string | number;
  pastoralGroup: { id: number; name: string } | null;
  assignmentsCount: number;
}

export interface MassDeleteResult {
  id: number;
  title: string;
  dateTime: string;
  removedSchedules: number;
  unlinkedEvents: number;
}
