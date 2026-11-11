// src/app/(admin)/missas/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, CalendarClock, Church } from 'lucide-react';
import Header, { HeaderAction } from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import GenericTable, {
  GenericTableColumn,
  GenericTableAction,
} from '@/components/ui/tables/GenericTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import MassFormModal from '@/components/ui/forms/MassFormModal';
import { useMasses } from '@/hooks/masses/useMasses';
import { useDebouncedValue } from '@/hooks/ui/useDebouncedValue';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { MASS_TYPE_LABELS } from '@/lib/masses/constants';
import { Mass } from '@/types/masses/masses';

const MISSAS_PATH = '/missas';
const NEW_MASS_PATH = '/missas/nova-missa';
const RECURRING_PATH = '/missas/missas-recorrentes';

type PeriodFilter = 'ALL' | 'UPCOMING' | 'PAST';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MissasPage() {
  const router = useRouter();
  const { canManageMasses } = usePermissions();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('UPCOMING');
  const [massId, setMassId] = useState<number | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  // "Agora" é fixado uma vez por filtro/montagem, para a chave da busca não mudar a cada render.
  const now = useMemo(() => new Date().toISOString(), [periodFilter]);

  const periodParams = (period: PeriodFilter) =>
    period === 'UPCOMING'
      ? { startDate: now }
      : period === 'PAST'
        ? { endDate: now }
        : {};

  const { data, isLoading, isError, error, refetch } = useMasses({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    // Próximas: da mais perto para a mais longe. Demais: da mais recente para a mais antiga.
    order: periodFilter === 'UPCOMING' ? 'asc' : 'desc',
    sortBy: 'dateTime',
    ...periodParams(periodFilter),
  });

  // Contagens reais (total do servidor), não só da página atual.
  const { data: allData } = useMasses({ limit: 1 });
  const { data: upcomingData } = useMasses({ limit: 1, ...periodParams('UPCOMING') });
  const { data: pastData } = useMasses({ limit: 1, ...periodParams('PAST') });

  const items = data?.data ?? [];

  function changePeriodFilter(value: PeriodFilter) {
    setPeriodFilter(value);
    setPage(1);
  }

  const back = `?voltar=${encodeURIComponent(MISSAS_PATH)}`;

const headerActions: HeaderAction[] = [
  ...(canManageMasses
    ? [{ label: 'Nova missa', onClick: () => router.push(`${NEW_MASS_PATH}${back}`) }]
    : []),
  {
    label: 'Missas que se repetem',
    kind: 'navigate',
    onClick: () => router.push(RECURRING_PATH),
  },
];

  const columns: GenericTableColumn<Mass>[] = [
    {
      key: 'title',
      label: 'Missa',
      render: (mass) => <span className="font-medium text-gray-800">{mass.title}</span>,
    },
    { key: 'date', label: 'Data e hora', render: (mass) => formatDateTime(mass.dateTime) },
    { key: 'type', label: 'Tipo', render: (mass) => MASS_TYPE_LABELS[mass.type] ?? mass.type },
    { key: 'location', label: 'Local', render: (mass) => mass.location },
  ];

  const actions: GenericTableAction<Mass>[] = [
    {
      label: canManageMasses ? 'Editar' : 'Ver',
      onClick: (mass) => setMassId(mass.id),
    },
  ];

  return (
    <>
      <Header
        title="Missas"
        description={
          canManageMasses
            ? 'Veja e organize as missas da paróquia.'
            : 'Veja as missas da paróquia.'
        }
        actions={headerActions}
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          icon={Church}
          title="Todas"
          value={allData?.total ?? '—'}
          onClick={() => changePeriodFilter('ALL')}
          active={periodFilter === 'ALL'}
        />
        <Card
          icon={CalendarClock}
          title="Próximas"
          value={upcomingData?.total ?? '—'}
          onClick={() => changePeriodFilter('UPCOMING')}
          active={periodFilter === 'UPCOMING'}
        />
        <Card
          icon={CalendarCheck}
          title="Já aconteceram"
          value={pastData?.total ?? '—'}
          onClick={() => changePeriodFilter('PAST')}
          active={periodFilter === 'PAST'}
        />
      </div>

      {isError && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {getFriendlyErrorMessage(error, 'Não foi possível carregar as missas.')}{' '}
          <button type="button" onClick={() => refetch()} className="underline">
            Tentar de novo
          </button>
        </p>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={items}
          rowKey={(mass) => mass.id}
          actions={actions}
          isLoading={isLoading}
          loadingMessage="Carregando as missas..."
          emptyMessage={
            search
              ? 'Nenhuma missa encontrada. Tente buscar outro nome.'
              : 'Nenhuma missa por aqui.'
          }
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Buscar por nome..."
          filters={[
            {
              key: 'period',
              placeholder: 'Mostrar',
              value: periodFilter,
              onChange: (v) => changePeriodFilter(v as PeriodFilter),
              options: [
                { value: 'UPCOMING', label: 'Próximas missas' },
                { value: 'PAST', label: 'Missas que já aconteceram' },
                { value: 'ALL', label: 'Todas as missas' },
              ],
            },
          ]}
        />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          onPageChange={setPage}
        />
      </div>

      <MassFormModal open={massId !== null} massId={massId} onClose={() => setMassId(null)} />
    </>
  );
}