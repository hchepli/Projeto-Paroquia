import { massMock } from "@/data/mass/mass";
import { eventMock } from "@/data/event/event";
import { CalendarEntry, CalendarCategoryKey } from "@/types/event/calendarEntry";

// ------------------------------------------------------------
// Simula a resposta de uma API de calendário (RF011), juntando
// Missas + Eventos num único formato leve (id, slug, title, etc).
// Quando o backend existir, o service passa a buscar isso pronto
// do endpoint, sem precisar montar aqui no front.
// ------------------------------------------------------------

function resolveEventCategory(category: string): CalendarCategoryKey {
  const normalized = category.toLowerCase();
  if (normalized.includes("pastoral")) return "pastorais";
  return "eventos";
}

const massEntries: CalendarEntry[] = massMock.map((mass) => {
  const start = new Date(mass.dateTime);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // duração padrão: 1h

  return {
    id: mass.id,
    slug: null,
    title: mass.title,
    start: start.toISOString(),
    end: end.toISOString(),
    category: "liturgia",
    type: "mass",
  };
});

const eventEntries: CalendarEntry[] = eventMock
  .filter((event) => event.status === "ATIVO")
  .map((event) => ({
    id: event.id,
    slug: event.slug,
    title: event.name,
    start: event.startDate,
    end: event.endDate ?? event.startDate,
    category: resolveEventCategory(event.category),
    type: "event",
  }));

export const calendarEntryMock: CalendarEntry[] = [...massEntries, ...eventEntries];