// src/types/attendance-confirmations/attendance-confirmation.ts
export interface AttendanceConfirmation {
  id: string; // uuid
  eventId: number;
  name: string;
  contact: string;
  createdAt: string;
}

export interface AttendanceConfirmationsPage {
  event: { id: number; name: string };
  data: AttendanceConfirmation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}