'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import MonthGrid from '@/components/ui/calendar/MonthGrid';
import MassFormModal from '@/components/ui/forms/MassFormModal';
import EventFormModal from '@/components/ui/forms/EventFormModal';
import AgendaTimeline, { AgendaItem } from '@/components/ui/calendar/AgendaTimeline';
import { getMonthLabel, getDaysInMonth, getFirstWeekdayOffset } from '@/lib/date/calendar';
import { isSameLocalDay } from '@/lib/date/datetime';
import { getErrorMessage } from '@/lib/errors';
import { useCalendar } from '@/hooks/calendar/useCalendar';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { CalendarItem } from '@/types/calendar/calendar-item';

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function toAgendaItem(item: CalendarItem): AgendaItem<CalendarItem> {
  return {
    id: item.id,
    entityType: item.type,
    time: formatTime(item.date),
    title: item.type === 'mass' ? 'Missa' : 'Evento',
    subtitle: item.title,
    color: item.type === 'mass' ? 'green' : 'purple',
    raw: item,
  };
}

export default function CalendarioPage() {
  const router = useRouter();
  const { canManageMasses, canManageEvents } = usePermissions();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [massId, setMassId] = useState<number | null>(null);
  const [eventId, setEventId] = useState<number | null>(null);

  const { start, end } = useMemo(() => getMonthRange(currentDate), [currentDate]);
  const { data: items, isLoading, isError, error, refetch } = useCalendar(start, end);

  function handleAgendaItemClick(item: AgendaItem<CalendarItem>) {
    if (!item.id || !item.entityType) return;
    if (item.entityType === 'mass') {
      setMassId(item.id);
    } else {
      setEventId(item.id);
    }
  }

  function handlePrevMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDay(1);
  }

  function handleNextMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDay(1);
  }

  const selectedDayItems = useMemo(
    () =>
      (items ?? [])
        .filter((item) => isSameLocalDay(item.date, currentDate, selectedDay))
        .map(toAgendaItem),
    [items, currentDate, selectedDay],
  );

  const headerActions = [
    ...(canManageMasses
      ? [{ label: 'Nova Missa', onClick: () => router.push('/calendario/nova-missa') }]
      : []),
    ...(canManageEvents
      ? [{ label: 'Novo Evento', onClick: () => router.push('/comunidade/eventos/registrar') }]
      : []),
  ];

  return (
    <>
      <Header
        title="Calendário"
        description="Gerencie todos os eventos e missas da paróquia!"
        actions={headerActions}
      />

      <div className="mt-8 flex items-start gap-6">
        <div className="flex-1">
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={handlePrevMonth}
              className="rounded border p-1.5 text-gray-600 hover:bg-gray-50"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-[16px] font-semibold">{getMonthLabel(currentDate)}</span>
            <button
              onClick={handleNextMonth}
              className="rounded border p-1.5 text-gray-600 hover:bg-gray-50"
              aria-label="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-400">Carregando...</p>
          ) : isError ? (
            <p className="text-sm text-red-600">
              {getErrorMessage(error, 'Erro ao carregar o calendário.')}{' '}
              <button onClick={() => refetch()} className="underline">
                Tentar novamente
              </button>
            </p>
          ) : (
            <MonthGrid
              daysInMonth={getDaysInMonth(currentDate)}
              firstWeekdayOffset={getFirstWeekdayOffset(currentDate)}
              items={items ?? []}
              currentDate={currentDate}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          )}
        </div>

        <div className="min-w-[320px] shrink-0 self-stretch rounded-[16px] border border-[rgba(0,0,0,0.1)] p-4">
          <p className="mb-4 text-[14px] font-semibold text-gray-700">
            {selectedDay} de {getMonthLabel(currentDate)}
          </p>
          <AgendaTimeline items={selectedDayItems} onItemClick={handleAgendaItemClick} />
        </div>
      </div>

      <MassFormModal open={massId !== null} massId={massId} onClose={() => setMassId(null)} />
      <EventFormModal
        open={eventId !== null}
        eventId={eventId}
        onClose={() => setEventId(null)}
      />
    </>
  );
}
