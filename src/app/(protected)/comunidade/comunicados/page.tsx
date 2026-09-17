'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, CheckCircle2, EyeOff, Newspaper } from 'lucide-react';
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
import { Announcement, AnnouncementStatus } from '@/types/announcements/announcement';
import { useRouter } from 'next/navigation';

type StatusFilter = 'ALL' | AnnouncementStatus;

interface Category {
  id: number;
  name: string;
  type: 'EVENT' | 'ANNOUNCEMENT';
}

async function fetchCategories(): Promise<Category[]> {
  const response = await fetch('/api/categories');
  if (!response.ok) throw new Error('Erro ao buscar categorias');
  return response.json();
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PUBLISHED', label: 'Publicados' },
  { value: 'DRAFT', label: 'Ocultos' },
];

export default function ComunicadosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const router = useRouter();

  const { data: tableData, isLoading: tableLoading } = useAnnouncements({
    search,
    page,
    limit: 10,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  const { data: totalData } = useAnnouncements({ limit: 1 });
  const { data: publishedData } = useAnnouncements({ status: 'PUBLISHED', limit: 1 });
  const { data: draftData } = useAnnouncements({ status: 'DRAFT', limit: 1 });

  const { data: recentData } = useAnnouncements({ limit: 100 });
  const thisMonthCount = useMemo(
    () => (recentData?.data ?? []).filter((a) => isThisMonth(a.createdAt)).length,
    [recentData],
  );

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const categoryNameById = useMemo(() => {
    const map: Record<number, string> = {};
    (categories ?? []).forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const items = tableData?.data ?? [];
  const totalCount = totalData?.total ?? 0;
  const publishedCount = publishedData?.total ?? 0;
  const draftCount = draftData?.total ?? 0;

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  function handleEdit(announcement: Announcement) {
    setEditingAnnouncement(announcement);
    setOpenFormModal(true);
  }

  function handleNew() {
    setEditingAnnouncement(null);
    setOpenFormModal(true);
  }

  function handleCloseModal() {
    setOpenFormModal(false);
    setEditingAnnouncement(null);
  }

  function toggleOcultosCard() {
    setStatusFilter((prev) => (prev === 'DRAFT' ? 'ALL' : 'DRAFT'));
    setPage(1);
  }

  // Movido de dentro da antiga AnnouncementsTable pra cá — a mutation não
  // deve viver num componente de apresentação (achado do Bloco A/Dia 1).
  async function handleToggleStatus(announcement: Announcement) {
    const nextStatus = announcement.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    setTogglingId(announcement.id);
    try {
      const res = await fetch(`/api/announcements/${announcement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar status.');
      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
    } catch {
      // Erro silencioso por ora — sem componente de toast definido ainda.
    } finally {
      setTogglingId(null);
    }
  }

  const columns: GenericTableColumn<Announcement>[] = [
    {
      key: 'date',
      label: 'Data',
      render: (item) => formatDate(item.createdAt),
    },
    {
      key: 'title',
      label: 'Aviso',
      render: (item) => item.title,
    },
    {
      key: 'category',
      label: 'Tipo',
      render: (item) => (
        <span className="rounded-full bg-[rgba(0,0,0,0.05)] px-2 py-1 text-xs font-medium text-[rgba(0,0,0,0.7)]">
          {item.categoryId ? categoryNameById[item.categoryId] ?? '—' : 'Sem categoria'}
        </span>
      ),
    },
  ];

  const actions: GenericTableAction<Announcement>[] = [
    {
      label: 'Editar',
      onClick: handleEdit,
    },
    {
      label: (item) => (item.status === 'PUBLISHED' ? 'Ocultar' : 'Publicar'),
      onClick: handleToggleStatus,
      disabled: (item) => togglingId === item.id,
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
        actions={[{ label: 'Registrar Comunicado', onClick: handleNew }]}
        onBack={() => router.back()}
      />

      <div className="mt-8 grid grid-cols-4 gap-4">
        <Card icon={Newspaper} title="Total de Comunicados" value={totalCount} />
        <Card icon={CheckCircle2} title="Publicados" value={publishedCount} />
        <Card
          icon={EyeOff}
          title="Ocultos"
          value={draftCount}
          onClick={toggleOcultosCard}
          active={statusFilter === 'DRAFT'}
        />
        <Card icon={CalendarDays} title="Criados este mês" value={thisMonthCount} />
      </div>

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={items}
          rowKey={(item) => item.id}
          actions={actions}
          isLoading={tableLoading}
          emptyMessage="Nenhum comunicado encontrado."
          search={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Buscar aviso..."
          filters={filters}
          headerSlot={
            <button className="flex shrink-0 items-center gap-1 rounded-lg border border-[rgba(0,0,0,0.1)] px-3 py-2 text-sm font-medium text-[rgba(0,0,0,0.7)] hover:bg-gray-50">
              Ver Todas <ArrowRight size={14} />
            </button>
          }
        />
        <PaginationControls
          page={tableData?.page ?? 1}
          totalPages={tableData?.totalPages ?? 1}
          onPageChange={setPage}
        />
      </div>

      <AnnouncementFormModal
        open={openFormModal}
        onClose={handleCloseModal}
        announcement={editingAnnouncement ?? undefined}
      />
    </>
  );
}
