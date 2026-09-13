'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, EyeOff, Newspaper } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import AnnouncementsTable from '@/components/ui/tables/AnnouncementsTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import AnnouncementFormModal from '@/components/ui/forms/AnnouncementFormModal';
import { useAnnouncements } from '@/hooks/announcements/useAnnouncements';
import { Announcement, AnnouncementStatus } from '@/types/announcements/announcement';

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

export default function ComunicadosPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Tabela paginada/filtrada (o que o usuário está navegando de fato).
  const { data: tableData, isLoading: tableLoading } = useAnnouncements({
    search,
    page,
    limit: 10,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  // Consultas leves pros cards de resumo — independentes da paginação/filtro
  // da tabela (mesmo padrão de Escalas: cards mostram o todo, tabela mostra
  // a fatia filtrada).
  const { data: totalData } = useAnnouncements({ limit: 1 });
  const { data: publishedData } = useAnnouncements({ status: 'PUBLISHED', limit: 1 });
  const { data: draftData } = useAnnouncements({ status: 'DRAFT', limit: 1 });

  // NOTA: não existe endpoint dedicado de "criados este mês" — pego os 100
  // mais recentes e filtro no client. Se o volume de comunicados crescer
  // muito, vale migrar isso pra um filtro de data no backend.
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

  return (
    <>
      <Header
        title="Comunicados"
        description="Gerencie os avisos e notícias da paróquia"
        actions={[{ label: 'Registrar Comunicado', onClick: handleNew }]}
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
        <AnnouncementsTable
          items={items}
          isLoading={tableLoading}
          categoryNameById={categoryNameById}
          onEdit={handleEdit}
          search={search}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
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
