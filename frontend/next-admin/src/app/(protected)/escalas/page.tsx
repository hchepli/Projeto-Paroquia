'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CalendarDays, CheckCircle2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import PastoralSwitcher from '@/components/ui/dropdowns/PastoralSwitcher';
import ReportsDropdown from '@/components/ui/dropdowns/ReportsDropdown';
import GenericTable, {
  GenericTableAction,
  GenericTableColumn,
} from '@/components/ui/tables/GenericTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { useSchedules } from '@/hooks/schedules/useSchedules';
import { useCoverage, CoverageItem } from '@/hooks/schedules/useCoverage';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';
import { useDebouncedValue } from '@/hooks/ui/useDebouncedValue';
import { getCurrentMonthRange } from '@/lib/date/month-range';
import { ROLE_NAMES } from '@/lib/constants/role-names';
import { Schedule } from '@/types/schedules/schedule';

const PAGE_SIZE = 10;

type View = 'ALL' | 'PENDING' | 'COMPLETE';

function formatWhen(iso: string) {
  const d = new Date(iso);
  const time = d
    .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    .replace(':', 'h');
  return `${d.toLocaleDateString('pt-BR')} às ${time}`;
}

function peopleSummary(s: Schedule) {
  const names = s.assignments.map((a) => a.volunteer.name);
  if (names.length === 0) return '—';
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')} e mais ${names.length - 3}`;
}

function friendly(error: unknown, what: string) {
  const msg = error instanceof Error && error.message ? error.message : `Não foi possível carregar ${what}.`;
  return `${msg} Tente de novo. Se continuar, avise a secretaria.`;
}

function TypeBadge({ type }: { type: 'MASS' | 'EVENT' }) {
  return (
    <span className="mr-2 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-[rgba(0,0,0,0.8)]">
      {type === 'MASS' ? 'Missa' : 'Evento'}
    </span>
  );
}

const scheduleColumns: GenericTableColumn<Schedule>[] = [
  {
    key: 'what',
    label: 'Missa ou evento',
    render: (s) => (
      <span>
        <TypeBadge type={s.mass ? 'MASS' : 'EVENT'} />
        {s.mass?.title ?? s.event?.name ?? '—'}
        {s.event?.status === 'CANCELLED' && (
          <span className="ml-2 text-xs font-medium text-red-700">(cancelado)</span>
        )}
      </span>
    ),
  },
  {
    key: 'when',
    label: 'Quando',
    render: (s) => {
      const iso = s.mass?.dateTime ?? s.event?.startDate;
      return iso ? formatWhen(iso) : '—';
    },
  },
  { key: 'pastoral', label: 'Pastoral', render: (s) => s.pastoralGroup?.name ?? '—' },
  { key: 'people', label: 'Quem serve', render: peopleSummary },
];

const coverageColumns: GenericTableColumn<CoverageItem>[] = [
  {
    key: 'what',
    label: 'Missa ou evento',
    render: (c) => (
      <span>
        <TypeBadge type={c.sourceType} />
        {c.title}
      </span>
    ),
  },
  { key: 'when', label: 'Quando', render: (c) => formatWhen(c.date) },
  {
    key: 'pastorals',
    label: 'Pastorais',
    render: (c) => (
      <div className="flex flex-wrap gap-1">
        {c.pastorals.map((p) => (
          <span
            key={p.id}
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              p.scheduled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {p.name} — {p.scheduled ? 'escalada' : 'falta escalar'}
          </span>
        ))}
      </div>
    ),
  },
];

export default function EscalasPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: pastoralGroups = [] } = usePastoralGroups();

  const [selectedPastoralGroupId, setSelectedPastoralGroupId] = useState<number | null>(null);
  const [view, setView] = useState<View>('ALL');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);

  const isCoordenador = currentUser?.role?.name === ROLE_NAMES.COORDENADOR;
  const effectivePastoralGroupId = isCoordenador ? undefined : (selectedPastoralGroupId ?? undefined);

  const monthRange = useMemo(() => getCurrentMonthRange(), []);
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const range = { startDate: monthRange.startISO, endDate: monthRange.endISO };

  const schedulesQuery = useSchedules({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    pastoralGroupId: effectivePastoralGroupId,
    ...range,
  });
  const totalQuery = useSchedules({
    page: 1,
    limit: 1,
    pastoralGroupId: effectivePastoralGroupId,
    ...range,
  });
  const coverageQuery = useCoverage({ ...range, pastoralGroupId: effectivePastoralGroupId });

  const coverage = coverageQuery.data ?? [];
  const pendingItems = coverage.filter(
    (c) => c.status === 'INCOMPLETE' && new Date(c.date).getTime() >= todayStart,
  );
  const completeItems = coverage.filter((c) => c.status === 'COMPLETE');

  const coverageRows = useMemo(() => {
    const base = view === 'PENDING' ? pendingItems : completeItems;
    const term = search.trim().toLowerCase();
    return term ? base.filter((c) => c.title.toLowerCase().includes(term)) : base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, coverage, search]);

  if (userLoading || !currentUser) {
    return <p className="py-6 text-sm text-gray-500">Carregando...</p>;
  }

  const title = isCoordenador
    ? `Escalas de ${currentUser.pastoralGroup?.name ?? '—'}`
    : selectedPastoralGroupId
      ? `Escalas de ${pastoralGroups.find((pg) => pg.id === selectedPastoralGroupId)?.name ?? '—'}`
      : 'Escalas de todas as pastorais';

  function changeView(next: View) {
    setView(next);
    setPage(1);
  }

  function buildExportQuery() {
    const query = new URLSearchParams();
    query.set('startDate', monthRange.startISO);
    query.set('endDate', monthRange.endISO);
    if (effectivePastoralGroupId) query.set('pastoralGroupId', String(effectivePastoralGroupId));
    if (search) query.set('search', search);
    return query;
  }

  const scheduleActions: GenericTableAction<Schedule>[] = [
    { label: 'Ver e editar', onClick: (s) => router.push(`/escalas/${s.id}`) },
  ];
  const pendingActions: GenericTableAction<CoverageItem>[] = [
    {
      label: 'Escalar',
      onClick: (c) => router.push(`/escalas/registrar?item=${c.sourceType}:${c.sourceId}`),
    },
  ];

  const coverageTotalPages = Math.max(1, Math.ceil(coverageRows.length / PAGE_SIZE));
  const coveragePage = coverageRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const emptyCoverage = search
    ? 'Nada encontrado para essa busca.'
    : view === 'PENDING'
      ? 'Tudo certo! Não falta escalar nenhuma pastoral neste mês.'
      : 'Nenhuma missa ou evento com todas as pastorais escaladas ainda.';

  const activeError =
    view === 'ALL' ? schedulesQuery.error : coverageQuery.error;

  return (
    <>
      <Header
        title={title}
        description={`Veja quem vai servir em cada missa e evento — ${monthRange.label}.`}
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
        actions={[{ label: 'Registrar escala', onClick: () => router.push('/escalas/registrar') }, { label: 'Cadastrar Voluntário', onClick: () => router.push('/pessoas/voluntarios/registrar') }]}
        actionsAdornment={<ReportsDropdown buildQuery={buildExportQuery} />}
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          icon={CalendarDays}
          title="Escalas do mês"
          value={totalQuery.data?.total ?? 0}
          onClick={() => changeView('ALL')}
          active={view === 'ALL'}
        />
        <Card
          icon={AlertCircle}
          title="Falta escalar"
          value={pendingItems.length}
          onClick={() => changeView('PENDING')}
          active={view === 'PENDING'}
        />
        <Card
          icon={CheckCircle2}
          title="Já escaladas"
          value={completeItems.length}
          onClick={() => changeView('COMPLETE')}
          active={view === 'COMPLETE'}
        />
      </div>

      {activeError && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {friendly(activeError, 'as escalas')}
        </p>
      )}

      <div className="my-6">
        {view === 'ALL' ? (
          <>
            <GenericTable
              columns={scheduleColumns}
              items={schedulesQuery.data?.data ?? []}
              rowKey={(s) => s.id}
              actions={scheduleActions}
              isLoading={schedulesQuery.isLoading}
              loadingMessage="Carregando escalas..."
              emptyMessage={
                search
                  ? 'Nenhuma escala encontrada para essa busca.'
                  : 'Ainda não há escalas neste mês. Clique em "Registrar escala" para criar a primeira.'
              }
              search={searchInput}
              onSearchChange={(v) => {
                setSearchInput(v);
                setPage(1);
              }}
              searchPlaceholder="Buscar por missa, evento ou pessoa..."
            />
            <PaginationControls
              page={schedulesQuery.data?.page ?? 1}
              totalPages={schedulesQuery.data?.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
        ) : (
          <>
            <GenericTable
              columns={coverageColumns}
              items={coveragePage}
              rowKey={(c) => `${c.sourceType}-${c.sourceId}`}
              actions={view === 'PENDING' ? pendingActions : undefined}
              isLoading={coverageQuery.isLoading}
              loadingMessage="Carregando..."
              emptyMessage={emptyCoverage}
              search={searchInput}
              onSearchChange={(v) => {
                setSearchInput(v);
                setPage(1);
              }}
              searchPlaceholder="Buscar missa ou evento..."
            />
            <PaginationControls page={page} totalPages={coverageTotalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}