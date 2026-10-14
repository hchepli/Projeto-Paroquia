import { calendarEntryMock } from "@/data/event/calendarEntry";
import { CalendarEntry } from "@/types/event/calendarEntry";

const DELAY_MS = 300;

// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch("/api/calendario");
// return response.json();
export async function getCalendarEntries(): Promise<CalendarEntry[]> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  return calendarEntryMock;
}