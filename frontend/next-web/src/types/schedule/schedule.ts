import { Mass } from "../event/mass";
import { Event } from "../event/event";
import { Volunteer } from "./volunteer";

// "escala" (a agenda de uma função pra uma missa OU um evento — nunca os dois)
export type ScheduleRole = "leitor" | "ministro_eucaristia" | "coroinha" | string;

interface ScheduleForMass {
  functionName: ScheduleRole;
  dateTime: string; // ISO date string
  massId: string;
  eventId: null;
  mass?: Mass;
  event?: never;
}

interface ScheduleForEvent {
  functionName: ScheduleRole;
  dateTime: string;
  massId: null;
  eventId: string;
  mass?: never;
  event?: Event;
}

// Union garante em tipo o mesmo CHECK constraint do banco:
// ou é missa, ou é evento, nunca os dois nem nenhum.
export type Schedule = { id: string } & (ScheduleForMass | ScheduleForEvent);

export type CreateScheduleInput =
  | Omit<ScheduleForMass, "mass">
  | Omit<ScheduleForEvent, "event">;

export type UpdateScheduleInput = Partial<CreateScheduleInput>;

// "escala_voluntarios" (join entre escala e voluntário)
export interface ScheduleAssignment {
  id: string;
  scheduleId: string;
  volunteerId: string;
  volunteer?: Volunteer; // populado quando a API fizer join/include
}

export type CreateScheduleAssignmentInput = Omit<ScheduleAssignment, "id" | "volunteer">;