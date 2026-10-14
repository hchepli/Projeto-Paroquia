'use client';

import { CalendarItem } from '@/types/calendar-item';

interface MonthGridProps {
  daysInMonth: number;
  firstWeekdayOffset: number;
  items: CalendarItem[];
  currentDate: Date;
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
}

// Mesma ordem de semana já usada no MiniCalendar (início na segunda).
const WEEKDAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];

// Mesmas cores do AgendaTimeline: mass = verde, event = roxo.
const TYPE_COLOR: Record<CalendarItem['type'], { bg: string; text: string; border: string }> = {
  mass: { bg: 'bg-[#2E7D32]/10', text: 'text-[#2E7D32]', border: 'border-[#2E7D32]' },
  event: { bg: 'bg-[#5E35B1]/10', text: 'text-[#5E35B1]', border: 'border-[#5E35B1]' },
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function MonthGrid({
  daysInMonth,
  firstWeekdayOffset,
  items,
  currentDate,
  selectedDay,
  onSelectDay,
}: MonthGridProps) {
  const emptySlots = Array.from({ length: firstWeekdayOffset });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const itemsByDay = new Map<number, CalendarItem[]>();
  for (const item of items) {
    const itemDate = new Date(item.date);
    if (
      itemDate.getFullYear() === currentDate.getFullYear() &&
      itemDate.getMonth() === currentDate.getMonth()
    ) {
      const day = itemDate.getDate();
      const list = itemsByDay.get(day) ?? [];
      list.push(item);
      itemsByDay.set(day, list);
    }
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-[rgba(0,0,0,0.1)]">
      <div className="grid grid-cols-7 border-b border-[rgba(0,0,0,0.1)] bg-gray-50">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-2 text-center text-[12px] font-medium text-gray-400">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-[110px]">
        {emptySlots.map((_, i) => (
          <div key={`empty-${i}`} className="border-b border-r border-[rgba(0,0,0,0.06)]" />
        ))}

        {days.map((day) => {
          const dayItems = itemsByDay.get(day) ?? [];
          const isSelected = day === selectedDay;
          const visibleItems = dayItems.slice(0, 3);
          const remaining = dayItems.length - visibleItems.length;

          return (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className={`flex flex-col items-start gap-1 border-b border-r border-[rgba(0,0,0,0.06)] p-2 text-left transition-colors hover:bg-gray-50 ${
                isSelected ? 'bg-[#701513]/5' : ''
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] ${
                  isSelected ? 'bg-[#701513] font-semibold text-white' : 'text-gray-700'
                }`}
              >
                {day}
              </span>

              <div className="flex w-full flex-col gap-1">
                {visibleItems.map((item) => {
                  const colors = TYPE_COLOR[item.type];
                  return (
                    <span
                      key={`${item.type}-${item.id}`}
                      className={`truncate rounded-md border-l-2 px-1.5 py-0.5 text-[10px] font-medium ${colors.bg} ${colors.text} ${colors.border}`}
                      title={`${formatTime(item.date)} ${item.title}`}
                    >
                      {formatTime(item.date)} {item.title}
                    </span>
                  );
                })}
                {remaining > 0 && (
                  <span className="text-[10px] text-gray-400">+{remaining} mais</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
