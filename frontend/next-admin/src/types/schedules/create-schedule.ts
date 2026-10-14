export interface CreateScheduleAssignmentInput {
  volunteerId: number;
  role: string;
}

export interface CreateScheduleInput {
  massId?: number;
  eventId?: number;
  pastoralGroupId?: number;
  assignments: CreateScheduleAssignmentInput[];
}