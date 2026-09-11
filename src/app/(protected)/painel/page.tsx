// src/app/(admin)/painel/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Ticket, Sparkles, EyeOff, Images } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import Table from '@/components/ui/tables/Table';
import EventsTable from '@/components/ui/tables/EventsTable';
import CalendarSidebar from '@/components/ui/calendar/CalendarSidebar';
import { AgendaItem } from '@/components/ui/calendar/AgendaTimeline';
import { getMonthLabel, getDaysInMonth, getFirstWeekdayOffset } from '@/lib/date/calendar';
import { useMasses } from '@/hooks/masses/useMasses';
import { useEvents } from '@/hooks/events/useEvents';
import { useAuditLogs } from '@/hooks/audit-logs/useAuditLogs';
import { useCalendar } from '@/hooks/calendar/useCalendar';
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

// mass -> verde, event -> roxo, mesma convenção usada em /calendario.
function toAgendaItem(item: CalendarItem): AgendaItem {
  return {
    time: formatTime(item.date),
    title: item.type === 'mass' ? 'Missa' : 'Evento',
    subtitle: item.title,
    color: item.type === 'mass' ? 'green' : 'purple',
  };
}

function isWithinNextDays(dateStr: string, days: number): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const limit = new Date();
  limit.setDate(now.getDate() + days);
  return d >= now && d <= limit;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function PainelPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

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

  // Só filtra pelo dia selecionado no mini calendário — sem visão semana/ano aqui,
  // conforme já combinado (Painel = diário, /calendario = mês/semana/dia/ano).
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
          { label: 'Nova Missa', onClick: () => {} },
          { label: 'Criar Evento', onClick: () => {} },
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
            {/* Escalas do mês: pendente — depende de ScheduleAssignment não ter "status".
                Mantido mockado até definirmos junto o conceito de "pendente" (Dia 5 do roadmap-admin-frontend). */}
            <Card icon={CheckCircle2} title="Escalas do mês" value={14} badge="1 pendente" badgeColor="red" />
            <Card
              icon={Ticket}
              title="Próximos eventos"
              value={eventsLoading ? '—' : upcomingEvents.length}
              description="Nos próximos 30 dias"
            />
            {/* Sacramentos: pendente — entidade não tem data, card precisa de reinterpretação (Dia 2 do roadmap-admin-frontend). */}
            <Card icon={Sparkles} title="Sacramentos" value={2} badge="Esta semana" badgeColor="blue" />
            {/* Avisos pendentes: pendente — falta ligar em GET /announcements?status=DRAFT. */}
            <Card icon={EyeOff} title="Avisos pendentes" value={3} badge="Aguardando revisão" badgeColor="yellow" />
            {/* Fotos na galeria: pendente — falta ligar em GET /photos. */}
            <Card icon={Images} title="Fotos na galeria" value={23} description="Nos últimos 30 dias" />
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
          />
        </div>
      </div>
    </>
  );
}