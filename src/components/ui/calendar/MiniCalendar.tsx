'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
  monthLabel: string; // ex: "Janeiro 2026"
  daysInMonth: number;
  firstWeekdayOffset: number; // dias vazios antes do dia 1
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const WEEKDAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];

export default function MiniCalendar({
  monthLabel,
  daysInMonth,
  firstWeekdayOffset,
  selectedDay,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: MiniCalendarProps) {
  const emptySlots = Array.from({ length: firstWeekdayOffset });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrevMonth} className="p-1 rounded hover:bg-gray-100">
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-[15px]">{monthLabel}</span>
        <button onClick={onNextMonth} className="p-1 rounded hover:bg-gray-100">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className="text-[11px] text-gray-400 font-medium">
            {day}
          </span>
        ))}

        {emptySlots.map((_, i) => (
          <span key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const isSelected = day === selectedDay;
          return (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[13px] transition-colors ${
                isSelected
                  ? 'bg-[#701513] text-white font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
