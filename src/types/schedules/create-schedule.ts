// src/types/schedules/create-schedule.ts
export interface CreateScheduleAssignmentInput {
  volunteerId: number;
  role: string;
}

export interface CreateScheduleInput {
  massId?: number;
  eventId?: number;
  assignments: CreateScheduleAssignmentInput[];
}