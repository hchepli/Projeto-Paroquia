// src/app/(admin)/painel/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, Ticket, AlertTriangle, EyeOff, Images } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import Table from '@/components/ui/tables/Table';
import EventsTable from '@/components/ui/tables/EventsTable';
import CalendarSidebar from '@/components/ui/calendar/CalendarSidebar';
import MassFormModal, { MassDto } from '@/components/ui/forms/MassFormModal';
import EventFormModal, { EventDto } from '@/components/ui/forms/EventFormModal';
import { AgendaItem } from '@/components/ui/calendar/AgendaTimeline';
import { getMonthLabel, getDaysInMonth, getFirstWeekdayOffset } from '@/lib/date/calendar';
import { useMasses } from '@/hooks/masses/useMasses';
import { useEvents } from '@/hooks/events/useEvents';
import { useAuditLogs } from '@/hooks/audit-logs/useAuditLogs';
import { useCalendar } from '@/hooks/calendar/useCalendar';
import { useAnnouncements } from '@/hooks/announcements/useAnnouncements';
import { usePhotos } from '@/hooks/photos/usePhotos';
import { useSchedulesSummary } from '@/hooks/schedules/useSchedulesSummary';
import { usePendingSchedules } from '@/hooks/schedules/usePendingSchedules';
import { useMassesWithoutPastoral } from '@/hooks/masses/useMassesWithoutPastoral';
import { CalendarItem } from '@/types/calendar/calendar-item';
import { mapAuditLogToRow } from '@/lib/audit-log-mapper';

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
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

function isWithinNextDays(dateStr: string, days: number): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const limit = new Date();
  limit.setDate(now.getDate() + days);
  return d >= now && d <= limit;
}

function isWithinLastDays(dateStr: string, days: number): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - days);
  return d >= start && d <= now;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

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

export default function PainelPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const [openModal, setOpenModal] = useState<'mass' | 'event' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { startISO, endISO } = useMemo(() => getTodayRange(), []);
  const { data: massesResult, isLoading: massesLoading } = useMasses({
    startDate: startISO,
    endDate: endISO,
    limit: 50,
  });
  const { data: eventsResult, isLoading: eventsLoading } = useEvents();
  const { data: auditLogsResult, isLoading: auditLoading } = useAuditLogs();

  const { start, end } = useMemo(() => getMonthRange(currentDate), [currentDate]);
  const { data: calendarItems } = useCalendar(start, end);

  // Missas do mês corrente sem Pastoral vinculada (RN017 proposta) —
  // endpoint dedicado GET /masses/without-pastoral, não inflaciona o
  // payload das outras listagens de Missa.
  const { data: massesWithoutPastoralResult } = useMassesWithoutPastoral({
    startDate: start,
    endDate: end,
  });

  // Escalas do mês corrente (Admin Geral/Secretaria veem todas, sem filtro de pastoral).
  const { data: monthSchedules = [] } = useSchedulesSummary({ startDate: start, endDate: end });
  const { data: pendingItems = [] } = usePendingSchedules({ startDate: start, endDate: end });

  // Avisos pendentes = Comunicados em rascunho (RF013).
  const { data: draftAnnouncementsData } = useAnnouncements({ status: 'DRAFT', limit: 1 });

  // Fotos na galeria nos últimos 30 dias.
  const { data: photos = [] } = usePhotos();

  const { data: editingMass } = useQuery({
    queryKey: ['masses', editingId],
    queryFn: () => fetchMassById(editingId!),
    enabled: openModal === 'mass' && editingId !== null,
  });

  const { data: editingEvent } = useQuery({
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

  const massesToday = massesResult?.data ?? [];

  const upcomingEvents = useMemo(
    () => (eventsResult?.data ?? []).filter((e) => isWithinNextDays(e.startDate, 30)),
    [eventsResult],
  );

  const massesWithoutPastoralCount = massesWithoutPastoralResult?.total ?? 0;

  const draftAnnouncementsCount = draftAnnouncementsData?.total ?? 0;

  const photosLast30Days = useMemo(
    () => photos.filter((p) => isWithinLastDays(p.createdAt, 30)).length,
    [photos],
  );

  const auditRows = useMemo(
    () => (auditLogsResult?.data ?? []).slice(0, 10).map(mapAuditLogToRow),
    [auditLogsResult],
  );

  const eventsTableItems = useMemo(
    () =>
      (eventsResult?.data ?? [])
        .slice(0, 5)
        .map((e) => ({ nome: e.name, data: formatShortDate(e.startDate) })),
    [eventsResult],
  );

  const agendaItems = useMemo(
    () =>
      (calendarItems ?? [])
        .filter((item) => new Date(item.date).getDate() === selectedDay)
        .map(toAgendaItem),
    [calendarItems, selectedDay],
  );

  return (
    <>
      <Header
        title="Painel Admin"
        description="Seja Bem Vindo ao Painel Administrativo da Paróquia!"
        actions={[
          { label: 'Nova Missa', onClick: () => setOpenModal('mass') },
          { label: 'Criar Evento', onClick: () => setOpenModal('event') },
        ]}
      />

      <div className="flex gap-6 items-start mt-8">
        <div className="flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-4">
            <Card
              icon={CalendarDays}
              title="Missas hoje"
              value={massesLoading ? '—' : massesToday.length}
              description={
                massesLoading
                  ? 'Carregando...'
                  : massesToday.length > 0
                  ? massesToday.map((m) => formatTime(m.dateTime)).join(' · ')
                  : 'Nenhuma missa hoje'
              }
            />
            <Card
              icon={CheckCircle2}
              title="Escalas do mês"
              value={monthSchedules.length}
              badge={pendingItems.length > 0 ? `${pendingItems.length} pendente(s)` : undefined}
              badgeColor="red"
            />
            <Card
              icon={Ticket}
              title="Próximos eventos"
              value={eventsLoading ? '—' : upcomingEvents.length}
              description="Nos próximos 30 dias"
            />
            <Card
              icon={AlertTriangle}
              title="Missas sem Pastoral"
              value={massesWithoutPastoralCount}
              description="Este mês"
            />
            <Card
              icon={EyeOff}
              title="Avisos pendentes"
              value={draftAnnouncementsCount}
              badge="Aguardando revisão"
              badgeColor="yellow"
            />
            <Card
              icon={Images}
              title="Fotos na galeria"
              value={photosLast30Days}
              description="Nos últimos 30 dias"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Table
                title="Últimas movimentações"
                items={auditRows}
                forbidden={auditLogsResult?.forbidden}
                isLoading={auditLoading}
              />
            </div>
            <div className="col-span-1">
              <EventsTable title="Eventos" items={eventsTableItems} />
            </div>
          </div>
        </div>

        <div className="min-w-[350px] shrink-0 rounded-[16px] border border-[rgba(0,0,0,0.3)] p-4 self-stretch">
          <CalendarSidebar
            monthLabel={getMonthLabel(currentDate)}
            daysInMonth={getDaysInMonth(currentDate)}
            firstWeekdayOffset={getFirstWeekdayOffset(currentDate)}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            agendaItems={agendaItems}
            onAgendaItemClick={handleAgendaItemClick}
          />
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
