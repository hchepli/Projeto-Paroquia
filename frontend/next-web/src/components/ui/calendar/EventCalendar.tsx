// components/ui/calendar/EventCalendar.tsx
"use client";

import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import type { View, Event as BigCalendarEvent } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-overrides.css";
import { useCalendarEntries } from "@/hooks/useCalendarEntries";
import { calendarCategories } from "@/data/event/calendarCategory";
import { CalendarCategoryKey, CalendarEntryType } from "@/types/event/calendarEntry";

const locales = { "pt-BR": ptBR };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});

const categoryColors: Record<CalendarCategoryKey, string> = calendarCategories.reduce(
  (acc, category) => ({ ...acc, [category.key]: category.color }),
  {} as Record<CalendarCategoryKey, string>
);

interface CalendarViewEvent extends BigCalendarEvent {
  id: string;
  slug: string | null;
  category: CalendarCategoryKey;
  type: CalendarEntryType;
}

function eventPropGetter(event: CalendarViewEvent) {
  return {
    style: {
      backgroundColor: categoryColors[event.category] ?? "#701513",
      borderRadius: "6px",
      border: "none",
      color: "#fff",
      fontSize: "0.75rem",
      padding: "2px 6px",
    },
  };
}

export default function EventCalendar() {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const { data: calendarEntries, loading } = useCalendarEntries();

  const events: CalendarViewEvent[] = useMemo(
    () =>
      (calendarEntries ?? []).map((entry) => ({
        id: entry.id,
        slug: entry.slug,
        title: entry.title,
        start: new Date(entry.start),
        end: new Date(entry.end),
        category: entry.category,
        type: entry.type,
      })),
    [calendarEntries]
  );

  function handleSelectEvent(event: CalendarViewEvent) {
    if (event.type === "event" && event.slug) {
      router.push(`/eventos/${event.slug}`);
      return;
    }

    router.push(`/missas/${event.id}`);
  }

  if (loading) {
    return (
      <div className="w-full rounded-2xl border border-gray-200 p-6">
        <p className="text-black/60">Carregando calendário...</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-gray-200 p-6">
      <BigCalendar
        localizer={localizer}
        events={events}
        culture="pt-BR"
        views={["month", "week", "day"]}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventPropGetter}
        style={{ height: 720, cursor: "pointer" }}
        messages={{
          next: "Próximo",
          previous: "Anterior",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          noEventsInRange: "Nenhum evento neste período.",
        }}
      />
    </div>
  );
}