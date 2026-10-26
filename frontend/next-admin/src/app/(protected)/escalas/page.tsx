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
import { useCoverage } from '@/hooks/schedules/useCoverage';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';
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

   const { data, isLoading } = useSchedules({
     page,
     limit: 10,
     search: search || undefined,
     pastoralGroupId: effectivePastoralGroupId,
    startDate: monthRange.startISO,
 endDate: monthRange.endISO,
   });

  const { data: coverage = [], isLoading: coverageLoading } = useCoverage({
    startDate: monthRange.startISO,
    endDate: monthRange.endISO,
    pastoralGroupId: effectivePastoralGroupId,
  });

  // Por enquanto só Missas (a lógica de Evento já vem pronta no back;
  // é só remover este filtro quando for liberar Eventos)
  const coverageMasses = coverage.filter((c) => c.sourceType === 'MASS');
  const completeCount = coverageMasses.filter((c) => c.status === 'COMPLETE').length;
  const pendingItems = coverageMasses.filter((c) => c.status === 'INCOMPLETE');

  // Coordenador só conta os voluntários da própria pastoral
  const membersCount = isCoordenador
    ? volunteers.filter((v) => v.pastoralGroupId === currentUser?.pastoralGroup?.id).length
    : selectedPastoralGroupId
      ? volunteers.filter((v) => v.pastoralGroupId === selectedPastoralGroupId).length
      : volunteers.length;

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
        <Card icon={CalendarDays} title="Missas do mês" value={coverageMasses.length} />
        <Card icon={CheckCircle2} title="Escalados" value={completeCount} />
        <Card icon={Users} title="Membros Ativos" value={membersCount} />
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
          <PendingSchedulesTable items={pendingItems} isLoading={coverageLoading} />
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