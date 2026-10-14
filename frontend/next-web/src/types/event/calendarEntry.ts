export type CalendarCategoryKey = "liturgia" | "eventos" | "pastorais";

export interface CalendarCategory {
  key: CalendarCategoryKey;
  label: string;
  color: string;
}

export type CalendarEntryType = "mass" | "event";

export interface CalendarEntry {
  id: string;
  slug: string | null; // presente apenas quando type === "event" (rota /eventos/[slug])
  title: string;
  start: string; // ISO date string
  end: string; // ISO date string
  category: CalendarCategoryKey;
  type: CalendarEntryType;
}