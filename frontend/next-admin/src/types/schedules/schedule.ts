// src/types/schedules/schedule.ts
export interface ScheduleVolunteerRef {
  id: number;
  name: string;
}

export interface ScheduleAssignment {
  id: number;
  scheduleId: string;
  volunteerId: number;
  role: string;
  createdAt: string;
  volunteer: ScheduleVolunteerRef;
}

export interface ScheduleMassRef {
  id: number;
  title: string;
  dateTime: string;
}

export interface ScheduleEventRef {
  id: number;
  name: string;
  startDate: string;
}

export interface SchedulePastoralGroupRef {
  id: number;
  name: string;
}

export interface Schedule {
  id: string;
  massId: number | null;
  eventId: number | null;
  pastoralGroupId: number | null;
  createdAt: string;
  updatedAt: string;
  mass: ScheduleMassRef | null;
  event: ScheduleEventRef | null;
  pastoralGroup: SchedulePastoralGroupRef | null;
  assignments: ScheduleAssignment[];
}