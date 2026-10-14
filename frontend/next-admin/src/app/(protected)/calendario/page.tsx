'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import MonthGrid from '@/components/ui/calendar/MonthGrid';
import MassFormModal, { MassDto } from '@/components/ui/forms/MassFormModal';
import EventFormModal, { EventDto } from '@/components/ui/forms/EventFormModal';
import AgendaTimeline, { AgendaItem } from '@/components/ui/calendar/AgendaTimeline';
import { getMonthLabel, getDaysInMonth, getFirstWeekdayOffset } from '@/lib/date/calendar';
import { useCalendar } from '@/hooks/calendar/useCalendar';
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

// Busca o registro completo (Mass ou Event) só quando o usuário clica num
// item da agenda — CalendarItem não carrega os campos que o modal precisa
// (location, notes, pastoralGroups, etc). ASSUMIDO: GET /masses/:id e
// GET /events/:id existem e devolvem o objeto completo com `pastoralGroups`.
async function fetchMassById(id: number): Promise<MassDto> {
  const res = await fetch(`/api/masses/${id}`);
  if (!res.ok) throw new Error('Erro ao buscar missa.');
  return res.json();
}

async function fetchEventById(id: number): Promise<EventDto> {
  const res = await fetch(`/api/events/${id}`);
  if (!res.ok) throw new Error('Erro ao buscar evento.');
  return res.json();
}

export default function CalendarioPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const [openModal, setOpenModal] = useState<'mass' | 'event' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { start, end } = useMemo(() => getMonthRange(currentDate), [currentDate]);
  const { data: items, isLoading } = useCalendar(start, end);

  const { data: editingMass, isFetching: loadingMass } = useQuery({
    queryKey: ['masses', editingId],
    queryFn: () => fetchMassById(editingId!),
    enabled: openModal === 'mass' && editingId !== null,
  });

  const { data: editingEvent, isFetching: loadingEvent } = useQuery({
    queryKey: ['events', editingId],
    queryFn: () => fetchEventById(editingId!),
    enabled: openModal === 'event' && editingId !== null,
  });

  function handleAgendaItemClick(item: AgendaItem<CalendarItem>) {
    if (!item.id || !item.entityType) return;
    setEditingId(item.id);
    setOpenModal(item.entityType);
  }

  function handleCloseModal() {
    setOpenModal(null);
    setEditingId(null);
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
        .filter((item) => new Date(item.date).getDate() === selectedDay)
        .map(toAgendaItem),
    [items, selectedDay],
  );

  return (
    <>
      <Header
        title="Calendário"
        description="Gerencie todos os eventos e missas da paróquia!"
        actions={[
          { label: 'Nova Missa', onClick: () => router.push('/calendario/nova-missa') },
          { label: 'Novo Evento', onClick: () => router.push('/comunidade/eventos/registrar') },
        ]}
      />

      <div className="mt-8 flex items-start gap-6">
        <div className="flex-1">
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={handlePrevMonth}
              className="rounded border p-1.5 text-gray-600 hover:bg-gray-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-[16px] font-semibold">{getMonthLabel(currentDate)}</span>
            <button
              onClick={handleNextMonth}
              className="rounded border p-1.5 text-gray-600 hover:bg-gray-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-400">Carregando...</p>
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

      <MassFormModal
        open={openModal === 'mass'}
        mass={editingId ? editingMass : null}
        onClose={handleCloseModal}
      />
      <EventFormModal
        open={openModal === 'event'}
        event={editingId ? editingEvent : null}
        onClose={handleCloseModal}
      />
    </>
  );
}