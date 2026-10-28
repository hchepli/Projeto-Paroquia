'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { CalendarDays, CheckCircle2, EyeOff, Newspaper } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import GenericTable, {
  GenericTableColumn,
  GenericTableAction,
  GenericTableFilter,
} from '@/components/ui/tables/GenericTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import AnnouncementFormModal from '@/components/ui/forms/AnnouncementFormModal';
import { useAnnouncements } from '@/hooks/announcements/useAnnouncements';
import { useAnnouncementStats } from '@/hooks/announcements/useAnnouncementStats';
import { useAnnouncementCategories } from '@/hooks/categories/useCategories';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { Announcement, AnnouncementStatus } from '@/types/announcements/announcement';

type StatusFilter = 'ALL' | AnnouncementStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PUBLISHED', label: 'Publicados' },
  { value: 'DRAFT', label: 'Ocultos' },
];

const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

export default function ComunicadosPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canManageAnnouncements } = usePermissions();

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: tableData,
    isLoading: tableLoading,
    isError: tableError,
  } = useAnnouncements({
    search,
    page,
    limit: 10,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });
  const { data: stats } = useAnnouncementStats();
  const { data: categories } = useAnnouncementCategories();

  const categoryNameById = useMemo(() => {
    const map: Record<number, string> = {};
    (categories ?? []).forEach((c) => (map[c.id] = c.name));
    return map;
  }, [categories]);

  if (!canManageAnnouncements) {
    return (
      <>
        <Header title="Comunicados" description="" onBack={() => router.back()} />
        <p className="mt-8 text-sm text-[rgba(0,0,0,0.7)]">
          Você não tem permissão para gerenciar comunicados.
        </p>
      </>
    );
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  function handleStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  function toggleOcultosCard() {
    handleStatusFilterChange(statusFilter === 'DRAFT' ? 'ALL' : 'DRAFT');
  }

  async function mutate(
    announcement: Announcement,
    request: () => Promise<Response>,
    fallbackMessage: string,
  ) {
    setBusyId(announcement.id);
    setActionError(null);
    try {
      const res = await request();
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? fallbackMessage);
      }
      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : fallbackMessage);
    } finally {
      setBusyId(null);
    }
  }

  function handleToggleStatus(a: Announcement) {
    const nextStatus = a.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    return mutate(
      a,
      () =>
        fetch(`/api/announcements/${a.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        }),
      'Falha ao atualizar status.',
    );
  }

  function handleDelete(a: Announcement) {
    if (!window.confirm(`Remover o comunicado "${a.title}"? Essa ação não pode ser desfeita.`)) {
      return;
    }
    return mutate(
      a,
      () => fetch(`/api/announcements/${a.id}`, { method: 'DELETE' }),
      'Falha ao remover comunicado.',
    );
  }

  const columns: GenericTableColumn<Announcement>[] = [
    { key: 'date', label: 'Data', render: (item) => formatDate(item.createdAt) },
    { key: 'title', label: 'Aviso', render: (item) => item.title },
    {
      key: 'category',
      label: 'Tipo',
      render: (item) => (
        <span className="rounded-full bg-[rgba(0,0,0,0.05)] px-2 py-1 text-xs font-medium text-[rgba(0,0,0,0.7)]">
          {item.categoryId ? (categoryNameById[item.categoryId] ?? '—') : 'Sem categoria'}
        </span>
      ),
    },
  ];

  const actions: GenericTableAction<Announcement>[] = [
    { label: 'Editar', onClick: setEditing },
    {
      label: (item) => (item.status === 'PUBLISHED' ? 'Ocultar' : 'Publicar'),
      onClick: handleToggleStatus,
      disabled: (item) => busyId === item.id,
    },
    {
      label: 'Remover',
      onClick: handleDelete,
      disabled: (item) => busyId === item.id,
    },
  ];

  const filters: GenericTableFilter[] = [
    {
      key: 'status',
      placeholder: 'Status',
      value: statusFilter,
      onChange: (value) => handleStatusFilterChange(value as StatusFilter),
      options: STATUS_OPTIONS,
    },
  ];

  return (
    <>
      <Header
        title="Comunicados"
        description="Gerencie os avisos e notícias da paróquia"
        actions={[
          {
            label: 'Registrar Comunicado',
            onClick: () => router.push('/comunidade/comunicados/registrar'),
          },
        ]}
        onBack={() => router.back()}
      />

      <div className="mt-8 grid grid-cols-4 gap-4">
        <Card icon={Newspaper} title="Total de Comunicados" value={stats?.total ?? 0} />
        <Card icon={CheckCircle2} title="Publicados" value={stats?.published ?? 0} />
        <Card
          icon={EyeOff}
          title="Ocultos"
          value={stats?.draft ?? 0}
          onClick={toggleOcultosCard}
          active={statusFilter === 'DRAFT'}
        />
        <Card icon={CalendarDays} title="Criados este mês" value={stats?.thisMonth ?? 0} />
      </div>

      {(actionError || tableError) && (
        <p className="mt-4 text-sm text-red-600">
          {actionError ?? 'Erro ao carregar comunicados. Tente novamente.'}
        </p>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={tableData?.data ?? []}
          rowKey={(item) => item.id}
          actions={actions}
          isLoading={tableLoading}
          emptyMessage="Nenhum comunicado encontrado."
          search={searchInput}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Buscar aviso..."
          filters={filters}
        />
        <PaginationControls
          page={tableData?.page ?? 1}
          totalPages={tableData?.totalPages ?? 1}
          onPageChange={setPage}
        />
      </div>

      <AnnouncementFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        announcement={editing ?? undefined}
      />
    </>
  );
}