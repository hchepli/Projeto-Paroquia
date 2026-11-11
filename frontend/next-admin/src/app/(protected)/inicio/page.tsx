'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  CheckCircle2,
  Ticket,
  AlertTriangle,
  EyeOff,
  Images,
  ClipboardList,
} from 'lucide-react';
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

// Ajuste aqui se alguma rota de criação for diferente.
const ROUTES = {
  masses: '/missas',
  newMass: '/missas/nova-missa',
  events: '/eventos',
  newEvent: '/eventos/registrar',
  announcements: '/avisos',
  newAnnouncement: '/avisos/registrar',
  albums: '/albuns',
  schedules: '/escalas',
  newSchedule: '/escalas/criar',
};

const ERROR_TEXT = 'Não foi possível carregar.';

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

function showValue(value: number, isLoading: boolean, isError: boolean) {
  return isLoading || isError ? '—' : value;
}

function showText(isLoading: boolean, isError: boolean, ok: string) {
  if (isLoading) return 'Carregando...';
  if (isError) return ERROR_TEXT;
  return ok;
}

export default function PainelPage() {
  const router = useRouter();
  const { canManageMasses, canManageEvents } = usePermissions();

  // Admin Geral e Secretaria gerenciam missas; Coordenador de Pastoral não.
  // Se existir um canManageAnnouncements no usePermissions, use-o para o botão "Novo Aviso".
  const isCoordinator = !canManageMasses;
  const canManageAnnouncements = !isCoordinator;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const [massId, setMassId] = useState<number | null>(null);
  const [eventId, setEventId] = useState<number | null>(null);

  const { startISO, endISO } = useMemo(() => getTodayRange(), []);

  // Mês ATUAL fixo: os cards "deste mês" não mudam ao navegar no calendário lateral.
  const monthRange = useMemo(() => getMonthRange(new Date()), []);
  // Mês navegado: só para o calendário lateral.
  const calendarRange = useMemo(() => getMonthRange(currentDate), [currentDate]);

  const {
    data: massesResult,
    isLoading: massesLoading,
    isError: massesError,
  } = useMasses({ startDate: startISO, endDate: endISO, limit: 50 });

  const {
    data: eventsResult,
    isLoading: eventsLoading,
    isError: eventsError,
  } = useEvents({ period: 'upcoming', status: 'ACTIVE', limit: 50 });

  const {
    data: auditLogsResult,
    isLoading: auditLoading,
    isError: auditError,
  } = useAuditLogs({ limit: 10 });

  const { data: calendarItems } = useCalendar(calendarRange.start, calendarRange.end);

  // Só Admin Geral/Secretaria (evita 403 para o Coordenador).
  const { data: massesWithoutPastoralResult, isLoading: noPastoralLoading, isError: noPastoralError } =
    useMassesWithoutPastoral({
      startDate: monthRange.start,
      endDate: monthRange.end,
      enabled: canManageMasses,
    });

  const { data: monthSchedules = [], isLoading: schedulesLoading, isError: schedulesError } =
    useSchedulesSummary({ startDate: monthRange.start, endDate: monthRange.end });
  const { data: pendingItems = [], isLoading: pendingLoading, isError: pendingError } =
    usePendingSchedules({ startDate: monthRange.start, endDate: monthRange.end });

  // Avisos ainda não publicados (rascunho). Só Admin Geral/Secretaria usam.
  const { data: draftAnnouncementsData, isLoading: draftLoading, isError: draftError } =
    useAnnouncements({ status: 'DRAFT', limit: 1 });

  const { data: photos = [], isLoading: photosLoading, isError: photosError } = usePhotos();

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

  const headerActions = isCoordinator
    ? [{ label: 'Registrar Escala', onClick: () => router.push(ROUTES.newSchedule) }]
    : [
        ...(canManageMasses
          ? [{ label: 'Nova Missa', onClick: () => router.push(ROUTES.newMass) }]
          : []),
        ...(canManageEvents
          ? [{ label: 'Novo Evento', onClick: () => router.push(ROUTES.newEvent) }]
          : []),
        ...(canManageAnnouncements
          ? [{ label: 'Novo Aviso', onClick: () => router.push(ROUTES.newAnnouncement) }]
          : []),
      ];

  const pendingBadge =
    !pendingLoading && !pendingError && pendingItems.length > 0
      ? `Falta escalar: ${pendingItems.length}`
      : undefined;

  return (
    <>
      <Header
        title="Início"
        description={
          isCoordinator
            ? 'Veja as missas, os eventos e as escalas da sua pastoral.'
            : 'Veja o que está acontecendo na paróquia.'
        }
        actions={headerActions}
      />

      <div className="flex flex-col xl:flex-row gap-6 items-start mt-8">
        <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            <Card
              icon={CalendarDays}
              title="Missas hoje"
              value={showValue(massesToday.length, massesLoading, massesError)}
              description={showText(
                massesLoading,
                massesError,
                massesToday.length > 0
                  ? massesToday.map((m) => formatTime(m.dateTime)).join(' · ')
                  : 'Nenhuma missa hoje',
              )}
              onClick={isCoordinator ? undefined : () => router.push(ROUTES.masses)}
            />

            <Card
              icon={CheckCircle2}
              title="Escalas deste mês"
              value={showValue(monthSchedules.length, schedulesLoading, schedulesError)}
              description={
                schedulesLoading ? 'Carregando...' : schedulesError ? ERROR_TEXT : undefined
              }
              badge={pendingBadge}
              badgeColor="red"
              onClick={() => router.push(ROUTES.schedules)}
            />

            {isCoordinator && (
              <Card
                icon={ClipboardList}
                title="Falta escalar"
                value={showValue(pendingItems.length, pendingLoading, pendingError)}
                description={showText(
                  pendingLoading,
                  pendingError,
                  pendingItems.length > 0 ? 'Missas e eventos da sua pastoral' : 'Tudo escalado',
                )}
                onClick={() => router.push(ROUTES.schedules)}
              />
            )}

            <Card
              icon={Ticket}
              title="Próximos eventos"
              value={showValue(upcomingEvents.length, eventsLoading, eventsError)}
              description={showText(eventsLoading, eventsError, 'Nos próximos 30 dias')}
              onClick={isCoordinator ? undefined : () => router.push(ROUTES.events)}
            />

            {!isCoordinator && (
              <>
                <Card
                  icon={AlertTriangle}
                  title="Missas sem pastoral"
                  value={showValue(massesWithoutPastoralCount, noPastoralLoading, noPastoralError)}
                  description={showText(noPastoralLoading, noPastoralError, 'Neste mês')}
                  onClick={() => router.push(ROUTES.masses)}
                />
                <Card
                  icon={EyeOff}
                  title="Avisos não publicados"
                  value={showValue(draftAnnouncementsCount, draftLoading, draftError)}
                  description={showText(draftLoading, draftError, 'Ainda não estão no site')}
                  onClick={() => router.push(ROUTES.announcements)}
                />
                <Card
                  icon={Images}
                  title="Fotos novas"
                  value={showValue(photosLast30Days, photosLoading, photosError)}
                  description={showText(photosLoading, photosError, 'Nos últimos 30 dias')}
                  onClick={() => router.push(ROUTES.albums)}
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 min-w-0">
              <Table
                title="Últimas alterações"
                items={auditRows}
                forbidden={auditLogsResult?.forbidden}
                isLoading={auditLoading}
                isError={auditError}
              />
            </div>
            <div className="lg:col-span-1 min-w-0">
              <EventsTable
                title="Próximos eventos"
                items={eventsTableItems}
                isLoading={eventsLoading}
                isError={eventsError}
              />
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[350px] xl:min-w-[350px] shrink-0 rounded-[16px] border border-[rgba(0,0,0,0.3)] p-4 xl:self-stretch">
          <CalendarSidebar
            monthLabel={getMonthLabel(currentDate)}
            daysInMonth={getDaysInMonth(currentDate)}
            firstWeekdayOffset={getFirstWeekdayOffset(currentDate)}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            agendaItems={agendaItems}
            onAgendaItemClick={isCoordinator ? undefined : handleAgendaItemClick}
          />
        </div>
      </div>

      {!isCoordinator && (
        <>
          <MassFormModal open={massId !== null} massId={massId} onClose={() => setMassId(null)} />
          <EventFormModal
            open={eventId !== null}
            eventId={eventId}
            onClose={() => setEventId(null)}
          />
        </>
      )}
    </>
  );
}