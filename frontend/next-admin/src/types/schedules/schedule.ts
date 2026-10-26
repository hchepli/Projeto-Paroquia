// src/types/schedules/schedule.ts
export interface ScheduleVolunteerRef { id: number; name: string }

export interface ScheduleAssignment {
  id: number;
  scheduleId: string;
  volunteerId: number;
  role: string;
  createdAt: string;
  volunteer: ScheduleVolunteerRef;
}

export interface ScheduleMassRef { id: number; title: string; dateTime: string }
export interface ScheduleEventRef { id: number; name: string; startDate: string; status?: 'ACTIVE' | 'CANCELLED' }
export interface SchedulePastoralGroupRef { id: number; name: string }

export interface Schedule {
  id: string;
  massId: number | null;
  eventId: number | null;
  pastoralGroupId: number; // NOT NULL desde a migration escalas_integridade
  createdAt: string;
  updatedAt: string;
  mass: ScheduleMassRef | null;
  event: ScheduleEventRef | null;
  pastoralGroup: SchedulePastoralGroupRef | null;
  assignments: ScheduleAssignment[];
}

/** Aviso (não bloqueia): voluntário em outra celebração a ±60 min. */
export interface ScheduleWarning {
  volunteerId: number;
  volunteerName: string;
  conflictsWith: { scheduleId: string; sourceType: 'MASS' | 'EVENT'; title: string; date: string };
}

export type ScheduleWithWarnings = Schedule & { warnings: ScheduleWarning[] };