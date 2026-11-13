'use client';

import { Suspense, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, EyeOff, Newspaper } from 'lucide-react';
import Header, { HeaderAction } from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import GenericTable, {
  GenericTableColumn,
  GenericTableAction,
} from '@/components/ui/tables/GenericTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import { useAnnouncements } from '@/hooks/announcements/useAnnouncements';
import { useAnnouncementStats } from '@/hooks/announcements/useAnnouncementStats';
import { useAnnouncementCategories } from '@/hooks/categories/useCategories';
import { useDebouncedValue } from '@/hooks/ui/useDebouncedValue';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { throwApiError } from '@/lib/errors';
import {
  ANNOUNCEMENT_STATUS_LABEL,
  getAnnouncementLoadError,
  getAnnouncementSaveError,
} from '@/lib/announcements/form';
import { Announcement, AnnouncementStatus } from '@/types/announcements/announcement';

const AVISOS_PATH = '/avisos';
const NEW_ANNOUNCEMENT_PATH = '/avisos/registrar';

type StatusFilter = 'ALL' | AnnouncementStatus;

function parseStatus(value: string | null): StatusFilter {
  return value === 'PUBLISHED' || value === 'DRAFT' ? value : 'ALL';
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

function AvisosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { canManageAnnouncements, isLoading: permissionsLoading } = usePermissions();

  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    parseStatus(searchParams.get('status')),
  );
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useAnnouncements(
    {
      page,
      limit: 10,
      search: search || undefined,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    },
    canManageAnnouncements,
  );
  const { data: stats } = useAnnouncementStats(canManageAnnouncements);
  const { data: categories } = useAnnouncementCategories();

  const categoryNameById = useMemo(() => {
    const map: Record<number, string> = {};
    (categories ?? []).forEach((c) => (map[c.id] = c.name));
    return map;
  }, [categories]);

  const items = data?.data ?? [];
  const back = `?voltar=${encodeURIComponent(AVISOS_PATH)}`;

  if (permissionsLoading) {
    return (
      <>
        <Header title="Avisos" description="" />
        <p className="mt-8 text-sm text-[rgba(0,0,0,0.5)]">Carregando...</p>
      </>
    );
  }

  if (!canManageAnnouncements) {
    return (
      <>
        <Header title="Avisos" description="" />
        <p className="mt-8 text-sm text-[rgba(0,0,0,0.7)]" role="alert">
          Você não tem acesso aos avisos. Quem cuida dos avisos é o Admin Geral e a Secretaria.
        </p>
      </>
    );
  }

  function changeStatusFilter(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  async function mutate(
    announcement: Announcement,
    request: () => Promise<Response>,
    fallback: string,
    afterSuccess?: () => void,
  ) {
    setBusyId(announcement.id);
    setActionError(null);
    try {
      const res = await request();
      if (!res.ok) await throwApiError(res, fallback);
      afterSuccess?.();
      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
    } catch (err) {
      setActionError(getAnnouncementSaveError(err, fallback));
    } finally {
      setBusyId(null);
    }
  }

  function handleToggleStatus(a: Announcement) {
    const nextStatus: AnnouncementStatus = a.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    return mutate(
      a,
      () =>
        fetch(`/api/announcements/${a.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        }),
      nextStatus === 'PUBLISHED'
        ? 'Não foi possível mostrar o aviso no site. Tente de novo.'
        : 'Não foi possível esconder o aviso do site. Tente de novo.',
    );
  }

  function handleDelete(a: Announcement) {
    if (
      !window.confirm(
        `Apagar o aviso "${a.title}"? Depois de apagar, não dá para recuperar.`,
      )
    ) {
      return;
    }
    return mutate(
      a,
      () => fetch(`/api/announcements/${a.id}`, { method: 'DELETE' }),
      'Não foi possível apagar o aviso. Tente de novo.',
      // se apagou o último da página, volta uma página
      () => {
        if (items.length === 1 && page > 1) setPage(page - 1);
      },
    );
  }

  const headerActions: HeaderAction[] = [
    {
      label: 'Registrar aviso',
      onClick: () => router.push(`${NEW_ANNOUNCEMENT_PATH}${back}`),
    },
  ];

  const columns: GenericTableColumn<Announcement>[] = [
    {
      key: 'title',
      label: 'Título',
      render: (item) => <span className="font-medium text-gray-800">{item.title}</span>,
    },
    {
      key: 'category',
      label: 'Tipo',
      render: (item) => (
        <span className="rounded-full bg-[rgba(0,0,0,0.05)] px-2 py-1 text-xs font-medium text-[rgba(0,0,0,0.7)]">
          {item.categoryId ? (categoryNameById[item.categoryId] ?? '—') : 'Sem tipo'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Situação',
      render: (item) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium text-[rgba(0,0,0,0.8)] ${
            item.status === 'PUBLISHED' ? 'bg-green-100' : 'bg-yellow-100'
          }`}
        >
          {ANNOUNCEMENT_STATUS_LABEL[item.status]}
        </span>
      ),
    },
    { key: 'date', label: 'Criado em', render: (item) => formatDate(item.createdAt) },
  ];

  const actions: GenericTableAction<Announcement>[] = [
    {
      label: 'Editar',
      onClick: (item) => router.push(`${AVISOS_PATH}/${item.id}${back}`),
      disabled: (item) => busyId === item.id,
    },
    {
      label: (item) => (item.status === 'PUBLISHED' ? 'Esconder do site' : 'Mostrar no site'),
      onClick: handleToggleStatus,
      disabled: (item) => busyId === item.id,
    },
    {
      label: 'Apagar',
      variant: 'danger',
      onClick: handleDelete,
      disabled: (item) => busyId === item.id,
    },
  ];

  const emptyMessage = search
    ? 'Nenhum aviso encontrado. Tente buscar outro título.'
    : statusFilter === 'DRAFT'
      ? 'Nenhum aviso aguardando publicação.'
      : statusFilter === 'PUBLISHED'
        ? 'Nenhum aviso está aparecendo no site agora.'
        : 'Nenhum aviso por aqui. Clique em "Novo aviso" para escrever o primeiro.';

  return (
    <>
      <Header
        title="Avisos"
        description="Escreva e organize os avisos que aparecem no site da paróquia."
        actions={headerActions}
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          icon={Newspaper}
          title="Todos os avisos"
          value={stats?.total ?? '—'}
          onClick={() => changeStatusFilter('ALL')}
          active={statusFilter === 'ALL'}
        />
        <Card
          icon={CheckCircle2}
          title="No site"
          value={stats?.published ?? '—'}
          onClick={() => changeStatusFilter('PUBLISHED')}
          active={statusFilter === 'PUBLISHED'}
        />
        <Card
          icon={EyeOff}
          title="Ainda não publicados"
          value={stats?.draft ?? '—'}
          onClick={() => changeStatusFilter('DRAFT')}
          active={statusFilter === 'DRAFT'}
        />
      </div>

      {actionError && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      )}

      {isError && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {getAnnouncementLoadError(error, 'Não foi possível carregar os avisos.')}{' '}
          <button type="button" onClick={() => refetch()} className="underline">
            Tentar de novo
          </button>
        </p>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={items}
          rowKey={(item) => item.id}
          actions={actions}
          isLoading={isLoading}
          loadingMessage="Carregando os avisos..."
          emptyMessage={emptyMessage}
          search={searchInput}
          onSearchChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          searchPlaceholder="Buscar por título..."
          filters={[
            {
              key: 'status',
              placeholder: 'Mostrar',
              value: statusFilter,
              onChange: (v) => changeStatusFilter(v as StatusFilter),
              options: [
                { value: 'ALL', label: 'Todos os avisos' },
                { value: 'PUBLISHED', label: 'Só os que estão no site' },
                { value: 'DRAFT', label: 'Só os ainda não publicados' },
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
    </>
  );
}

export default function AvisosPage() {
  return (
    <Suspense fallback={null}>
      <AvisosContent />
    </Suspense>
  );
}