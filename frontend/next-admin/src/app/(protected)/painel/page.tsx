// src/app/(admin)/painel/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, CheckCircle2, Ticket, AlertTriangle, EyeOff, Images } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import Table from '@/components/ui/tables/Table';
import EventsTable from '@/components/ui/tables/EventsTable';
import CalendarSidebar from '@/components/ui/calendar/CalendarSidebar';
import MassFormModal from '@/components/ui/forms/MassFormModal';
import EventFormModal from '@/components/ui/forms/EventFormModal';
import { AgendaItem } from '@/components/ui/calendar/AgendaTimeline';
import { getMonthLabel, getDaysInMonth, getFirstWeekdayOffset } from '@/lib/date/calendar';
import { isSameLocalDay } from '@/lib/date/datetime';
import { useMasses } from '@/hooks/masses/useMasses';
import { useEvents } from '@/hooks/events/useEvents';
import { useAuditLogs } from '@/hooks/audit-logs/useAuditLogs';
import { useCalendar } from '@/hooks/calendar/useCalendar';
import { useAnnouncements } from '@/hooks/announcements/useAnnouncements';
import { usePhotos } from '@/hooks/photos/usePhotos';
import { useSchedulesSummary } from '@/hooks/schedules/useSchedulesSummary';
import { usePendingSchedules } from '@/hooks/schedules/usePendingSchedules';
import { useMassesWithoutPastoral } from '@/hooks/masses/useMassesWithoutPastoral';
import { usePermissions } from '@/hooks/auth/usePermissions';
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

export default function PainelPage() {
  const router = useRouter();
  const { canManageMasses, canManageEvents } = usePermissions();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const [massId, setMassId] = useState<number | null>(null);
  const [eventId, setEventId] = useState<number | null>(null);

  const { startISO, endISO } = useMemo(() => getTodayRange(), []);
  const { data: massesResult, isLoading: massesLoading } = useMasses({
    startDate: startISO,
    endDate: endISO,
    limit: 50,
  });
  const { data: eventsResult, isLoading: eventsLoading } = useEvents({
    period: 'upcoming',
    status: 'ACTIVE',
    limit: 50,
  });
const { data: auditLogsResult, isLoading: auditLoading, isError: auditError } = useAuditLogs({ limit: 10 });

  const { start, end } = useMemo(() => getMonthRange(currentDate), [currentDate]);
  const { data: calendarItems } = useCalendar(start, end);

  // Missas do mês sem Pastoral vinculada (RN017 proposta). Endpoint restrito a
  // Admin Geral/Secretaria: para os demais cargos nem dispara (evita 403).
  const { data: massesWithoutPastoralResult } = useMassesWithoutPastoral({
    startDate: start,
    endDate: end,
    enabled: canManageMasses,
  });

  // Escalas do mês corrente (Admin Geral/Secretaria veem todas, sem filtro de pastoral).
  const { data: monthSchedules = [] } = useSchedulesSummary({ startDate: start, endDate: end });
  const { data: pendingItems = [] } = usePendingSchedules({ startDate: start, endDate: end });

  // Avisos pendentes = Comunicados em rascunho (RF013).
  const { data: draftAnnouncementsData } = useAnnouncements({ status: 'DRAFT', limit: 1 });

  // Fotos na galeria nos últimos 30 dias.
  const { data: photos = [] } = usePhotos();


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
  () => (auditLogsResult?.data ?? []).map(mapAuditLogToRow),
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
        .filter((item) => isSameLocalDay(item.date, currentDate, selectedDay))
        .map(toAgendaItem),
    [calendarItems, currentDate, selectedDay],
  );

  const headerActions = [
    ...(canManageMasses
      ? [{ label: 'Nova Missa', onClick: () => router.push('/calendario/nova-missa') }]
      : []),
    ...(canManageEvents ? [{ label: 'Criar Evento', onClick: () => router.push('/comunidade/eventos/registrar') }] : []),
  ];

  return (
    <>
      <Header
        title="Painel Admin"
        description="Seja Bem Vindo ao Painel Administrativo da Paróquia!"
        actions={headerActions}
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
              onClick={() => router.push('/calendario')}
            />
            <Card
              icon={CheckCircle2}
              title="Escalas do mês"
              value={monthSchedules.length}
              badge={pendingItems.length > 0 ? `${pendingItems.length} pendente(s)` : undefined}
              badgeColor="red"
              onClick={() => router.push('/escalas')}
            />
            <Card
              icon={Ticket}
              title="Próximos eventos"
              value={eventsLoading ? '—' : upcomingEvents.length}
              description="Nos próximos 30 dias"
              onClick={() => router.push('/comunidade/eventos')}
            />
            {canManageMasses && (
              <Card
                icon={AlertTriangle}
                title="Missas sem Pastoral"
                value={massesWithoutPastoralCount}
                description="Este mês"
                onClick={() => router.push('/calendario')}
              />
            )}
            <Card
              icon={EyeOff}
              title="Avisos pendentes"
              value={draftAnnouncementsCount}
              badge="Aguardando revisão"
              badgeColor="yellow"
              onClick={() => router.push('/comunidade/comunicados')}
            />
            <Card
              icon={Images}
              title="Fotos na galeria"
              value={photosLast30Days}
              description="Nos últimos 30 dias"
              onClick={() => router.push('/comunidade/albuns')}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Table
                title="Últimas movimentações"
                items={auditRows}
                forbidden={auditLogsResult?.forbidden}
                isLoading={auditLoading}
                isError={auditError}
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

      <MassFormModal open={massId !== null} massId={massId} onClose={() => setMassId(null)} />
      <EventFormModal
        open={eventId !== null}
        eventId={eventId}
        onClose={() => setEventId(null)}
      />
    </>
  );
}
