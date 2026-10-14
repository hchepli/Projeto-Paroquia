import MiniCalendar from '@/components/ui/calendar/MiniCalendar';
import AgendaTimeline, { AgendaItem } from '@/components/ui/calendar/AgendaTimeline';

interface CalendarSidebarProps<TRaw = unknown> {
  monthLabel: string;
  daysInMonth: number;
  firstWeekdayOffset: number;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  agendaItems: AgendaItem<TRaw>[];
  onAgendaItemClick?: (item: AgendaItem<TRaw>) => void;
}

export default function CalendarSidebar<TRaw = unknown>({
  monthLabel,
  daysInMonth,
  firstWeekdayOffset,
  selectedDay,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  agendaItems,
  onAgendaItemClick,
}: CalendarSidebarProps<TRaw>) {
  return (
    <div className="flex flex-col justify-beetwen  gap-6 h-full overflow-y-auto">
      <MiniCalendar
        monthLabel={monthLabel}
        daysInMonth={daysInMonth}
        firstWeekdayOffset={firstWeekdayOffset}
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />

      <div className="border-t border-gray-100 pt-4">
        <AgendaTimeline items={agendaItems} onItemClick={onAgendaItemClick} />
      </div>
    </div>
  );
}