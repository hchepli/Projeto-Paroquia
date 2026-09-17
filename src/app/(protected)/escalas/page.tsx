'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CalendarDays, CheckCircle2, Users } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import PastoralSwitcher from '@/components/ui/dropdowns/PastoralSwitcher';
import ReportsDropdown from '@/components/ui/dropdowns/ReportsDropdown';
import SchedulesTable from '@/components/ui/tables/SchedulesTable';
import PendingSchedulesTable from '@/components/ui/tables/PendingSchedulesTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { useSchedules } from '@/hooks/schedules/useSchedules';
import { useSchedulesSummary } from '@/hooks/schedules/useSchedulesSummary';
import { usePendingSchedules } from '@/hooks/schedules/usePendingSchedules';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';
import { useMasses } from '@/hooks/masses/useMasses';
import { useVolunteers } from '@/hooks/volunteers/useVolunteers';
import { getCurrentMonthRange } from '@/lib/date/month-range';

const COORDENADOR_ROLE = 'Coordenador de Pastoral';

export default function EscalasPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: pastoralGroups = [] } = usePastoralGroups();
  const { data: volunteers = [] } = useVolunteers();

  const [selectedPastoralGroupId, setSelectedPastoralGroupId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showPending, setShowPending] = useState(false);

  const isCoordenador = currentUser?.role.name === COORDENADOR_ROLE;
  const effectivePastoralGroupId = isCoordenador ? undefined : (selectedPastoralGroupId ?? undefined);

  const monthRange = getCurrentMonthRange();

  const { data: massesResult } = useMasses({
    startDate: monthRange.startISO,
    endDate: monthRange.endISO,
    limit: 100,
  });
  const massesThisMonth = massesResult?.data ?? [];

  const { data, isLoading } = useSchedules({
    page,
    limit: 10,
    search: search || undefined,
    pastoralGroupId: effectivePastoralGroupId,
  });

  const { data: monthSchedules = [] } = useSchedulesSummary({
    startDate: monthRange.startISO,
    endDate: monthRange.endISO,
    pastoralGroupId: effectivePastoralGroupId,
  });

  const { data: pendingItems = [], isLoading: pendingLoading } = usePendingSchedules({
    startDate: monthRange.startISO,
    endDate: monthRange.endISO,
    pastoralGroupId: effectivePastoralGroupId,
  });

  const assignmentsCount = monthSchedules.reduce((sum, s) => sum + s.assignments.length, 0);

  if (userLoading || !currentUser) {
    return null;
  }

  const title = isCoordenador
    ? `Escalas de ${currentUser.pastoralGroup?.name ?? '—'}`
    : selectedPastoralGroupId
      ? `Escalas de ${pastoralGroups.find((pg) => pg.id === selectedPastoralGroupId)?.name ?? '—'}`
      : 'Escalas de Todas as Pastorais';

  function buildExportQuery() {
    const query = new URLSearchParams();
    query.set('startDate', monthRange.startISO);
    query.set('endDate', monthRange.endISO);
    if (effectivePastoralGroupId) query.set('pastoralGroupId', String(effectivePastoralGroupId));
    if (search) query.set('search', search);
    return query;
  }

  return (
    <>
      <Header
        title={title}
        description="Você gerencia as escalas!"
        titleAdornment={
          !isCoordenador ? (
            <PastoralSwitcher
              pastoralGroups={pastoralGroups}
              selectedId={selectedPastoralGroupId}
              onSelect={(id) => {
                setSelectedPastoralGroupId(id);
                setPage(1);
              }}
            />
          ) : undefined
        }
        actions={[{ label: 'Registrar Escala', onClick: () => router.push('/escalas/registrar') }]}
        actionsAdornment={<ReportsDropdown buildQuery={buildExportQuery} />}
      />

      <div className="mt-8 grid grid-cols-4 gap-4">
        <Card icon={CalendarDays} title="Missas do mês" value={massesThisMonth.length} />
        <Card icon={CheckCircle2} title="Escalados" value={assignmentsCount} />
        <Card icon={Users} title="Membros Ativos" value={volunteers.length} />
        <Card
          icon={AlertCircle}
          title="Pendentes"
          value={pendingItems.length}
          onClick={() => setShowPending((prev) => !prev)}
          active={showPending}
        />
      </div>

      {showPending && (
        <div className="mt-4">
          <PendingSchedulesTable items={pendingItems} isLoading={pendingLoading} />
        </div>
      )}

      <div className="my-6">
        <SchedulesTable
          items={data?.data ?? []}
          isLoading={isLoading}
          monthLabel={monthRange.label}
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          onPageChange={setPage}
        />
      </div>
    </>
  );
}