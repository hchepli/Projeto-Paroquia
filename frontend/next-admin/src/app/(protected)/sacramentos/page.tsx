'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, FileText, HelpCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import GenericTable, {
  GenericTableAction,
  GenericTableColumn,
} from '@/components/ui/tables/GenericTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import ConfirmDialog from '@/components/ui/forms/ConfirmDialog';
import { useSacraments, SACRAMENTS_KEY } from '@/hooks/sacraments/useSacraments';
import { useReorderSacraments } from '@/hooks/sacraments/useReorderSacraments';
import { useDeleteSacrament } from '@/hooks/sacraments/useDeleteSacrament';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { useDebouncedValue } from '@/hooks/ui/useDebouncedValue';
import {
  getSacramentDeleteError,
  getSacramentLoadError,
  getSacramentReorderError,
} from '@/lib/sacraments/errors';
import { Sacrament } from '@/types/sacraments/sacraments';

const PAGE_SIZE = 10;
type Filter = 'all' | 'withDocs' | 'noFaq';

export default function SacramentosPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canManageSacraments, isLoading: permsLoading } = usePermissions();
  const { data, isLoading, isError, error, refetch } = useSacraments();
  const reorder = useReorderSacraments();
  const deleteSacrament = useDeleteSacrament();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Sacrament | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Lista completa na ordem do site (o back já ordena; reordenar aqui é só segurança).
  const items = useMemo(
    () => [...(data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id),
    [data],
  );

  const hasDocs = (s: Sacrament) => Boolean(s.requiredDocuments?.trim());
  const faqCount = (s: Sacrament) => s.faq?.length ?? 0;

  const withDocsCount = items.filter(hasDocs).length;
  const noFaqCount = items.filter((s) => faqCount(s) === 0).length;

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return items.filter((s) => {
      const matchesFilter =
        filter === 'all' || (filter === 'withDocs' ? hasDocs(s) : faqCount(s) === 0);
      return matchesFilter && (!term || s.name.toLowerCase().includes(term));
    });
  }, [items, filter, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasFilterOrSearch = filter !== 'all' || debouncedSearch.trim() !== '';

  function toggleFilter(next: Filter) {
    setFilter((prev) => (prev === next ? 'all' : next));
    setPage(1);
  }

  async function move(sacrament: Sacrament, direction: -1 | 1) {
    const from = items.findIndex((s) => s.id === sacrament.id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= items.length) return;

    const ids = items.map((s) => s.id);
    [ids[from], ids[to]] = [ids[to], ids[from]];

    setActionError(null);
    try {
      await reorder.mutateAsync(ids);
    } catch (err) {
      setActionError(getSacramentReorderError(err));
      queryClient.invalidateQueries({ queryKey: SACRAMENTS_KEY });
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    try {
      await deleteSacrament.mutateAsync(deleting.id);
      setDeleting(null);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 404) {
        // Já removido por outra pessoa: atualiza a lista e fecha.
        queryClient.invalidateQueries({ queryKey: SACRAMENTS_KEY });
        setDeleting(null);
        setActionError(getSacramentDeleteError(err));
      } else {
        setDeleteError(getSacramentDeleteError(err));
      }
    }
  }

  const columns: GenericTableColumn<Sacrament>[] = [
    {
      key: 'order',
      label: 'Posição',
      render: (s) => items.findIndex((i) => i.id === s.id) + 1,
    },
    {
      key: 'name',
      label: 'Nome',
      render: (s) => <span className="font-medium text-gray-800">{s.name}</span>,
    },
    {
      key: 'docs',
      label: 'Documentos necessários',
      render: (s) => (hasDocs(s) ? 'Sim' : <span className="text-amber-700">Não</span>),
    },
    {
      key: 'faq',
      label: 'Perguntas frequentes',
      render: (s) =>
        faqCount(s) === 0 ? <span className="text-amber-700">Nenhuma</span> : faqCount(s),
    },
  ];

  const reorderBlocked = hasFilterOrSearch;

  const actions: GenericTableAction<Sacrament>[] = [
    {
      label: 'Ver',
      onClick: (s) => router.push(`/sacramentos/${s.id}`),
      ariaLabel: (s) => `Ver o sacramento ${s.name}`,
    },
    ...(canManageSacraments
      ? ([
          {
            label: 'Editar',
            onClick: (s) => router.push(`/sacramentos/${s.id}?edit=1`),
            ariaLabel: (s) => `Editar o sacramento ${s.name}`,
          },
          {
            label: 'Subir',
            onClick: (s) => move(s, -1),
            disabled: (s) => reorder.isPending || reorderBlocked || items[0]?.id === s.id,
            ariaLabel: (s) => `Subir ${s.name} na lista`,
          },
          {
            label: 'Descer',
            onClick: (s) => move(s, 1),
            disabled: (s) =>
              reorder.isPending || reorderBlocked || items[items.length - 1]?.id === s.id,
            ariaLabel: (s) => `Descer ${s.name} na lista`,
          },
          {
            label: 'Remover',
            onClick: (s) => {
              setActionError(null);
              setDeleteError(null);
              setDeleting(s);
            },
            variant: 'danger',
            ariaLabel: (s) => `Remover o sacramento ${s.name}`,
          },
        ] satisfies GenericTableAction<Sacrament>[])
      : []),
  ];

  const emptyMessage = hasFilterOrSearch
    ? 'Nenhum sacramento encontrado. Tente outra palavra ou limpe o filtro.'
    : canManageSacraments
      ? 'Ainda não há sacramentos. Clique em "Novo sacramento" para criar o primeiro.'
      : 'Ainda não há sacramentos.';

  return (
    <>
      <Header
        title="Sacramentos"
        description="Veja e organize os sacramentos que aparecem no site, na ordem da lista."
        actions={
          !permsLoading && canManageSacraments
            ? [{ label: 'Novo sacramento', onClick: () => router.push('/sacramentos/registrar') }]
            : []
        }
        onBack={() => router.back()}
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          icon={BookOpen}
          title="Todos os sacramentos"
          value={items.length}
          onClick={() => {
            setFilter('all');
            setPage(1);
          }}
          active={filter === 'all'}
          actionLabel="Ver todos"
        />
        <Card
          icon={FileText}
          title="Com documentos necessários"
          value={withDocsCount}
          onClick={() => toggleFilter('withDocs')}
          active={filter === 'withDocs'}
          actionLabel="Filtrar"
        />
        <Card
          icon={HelpCircle}
          title="Sem perguntas frequentes"
          value={noFaqCount}
          onClick={() => toggleFilter('noFaq')}
          active={filter === 'noFaq'}
          actionLabel="Filtrar"
        />
      </div>

      {isError && (
        <div role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-base text-red-700">
          {getSacramentLoadError(error)}{' '}
          <button type="button" onClick={() => refetch()} className="font-medium underline">
            Tentar de novo
          </button>
        </div>
      )}
      {actionError && (
        <div role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-base text-red-700">
          {actionError}
        </div>
      )}
      {canManageSacraments && reorderBlocked && (
        <p className="mt-4 text-base text-gray-600">
          Para mudar a posição, limpe a busca e o filtro e volte para &quot;Todos os
          sacramentos&quot;.
        </p>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={pageItems}
          rowKey={(s) => s.id}
          actions={actions}
          isLoading={isLoading || permsLoading}
          loadingMessage="Carregando sacramentos..."
          emptyMessage={emptyMessage}
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Buscar pelo nome..."
        />
        <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {deleting && (
        <ConfirmDialog
          title="Remover sacramento"
          message={`Remover "${deleting.name}"? Ele deixa de aparecer no site e isso não pode ser desfeito.`}
          confirmLabel="Remover"
          loadingLabel="Removendo..."
          danger
          isLoading={deleteSacrament.isPending}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}