// src/app/(protected)/comunidade/eventos/[id]/confirmacoes/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/modals/Modal';
import GenericTable, {
  GenericTableAction,
  GenericTableColumn,
} from '@/components/ui/tables/GenericTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import { useAttendanceConfirmations } from '@/hooks/attendance-confirmations/useAttendanceConfirmations';
import { useDeleteAttendanceConfirmation } from '@/hooks/attendance-confirmations/useDeleteAttendanceConfirmation';
import { useDebouncedValue } from '@/hooks/ui/useDebouncedValue';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { ApiError, getFriendlyErrorMessage } from '@/lib/errors';
import { AttendanceConfirmation } from '@/types/attendance-confirmations/attendance-confirmation';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConfirmacoesPresencaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const eventId = Number(params.id);

  const { canManageEvents, isLoading: permLoading } = usePermissions();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [toDelete, setToDelete] = useState<AttendanceConfirmation | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const deleteConfirmation = useDeleteAttendanceConfirmation();

  // Coordenador nem dispara a consulta (o back responderia 403).
  const { data, isLoading, isError, error, refetch } = useAttendanceConfirmations({
    eventId,
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    order,
    enabled: canManageEvents,
  });

  const backToEvent = () => router.push(`/comunidade/eventos/${eventId}`);

  if (permLoading) return <p className="mt-8 text-sm text-gray-400">Carregando...</p>;

  const forbidden = !canManageEvents || (error instanceof ApiError && error.status === 403);
  if (forbidden) {
    return (
      <>
        <Header title="Confirmações de presença" description="" onBack={() => router.back()} />
        <p className="mt-8 text-sm text-gray-600">
          Você não tem permissão para ver as confirmações de presença deste evento.
        </p>
      </>
    );
  }

  async function handleConfirmDelete() {
    if (!toDelete) return;
    setDeleteError(null);
    // Se for o último item de uma página > 1, volta uma página (evita página vazia).
    const wasLastOnPage = (data?.data.length ?? 0) === 1 && page > 1;
    try {
      await deleteConfirmation.mutateAsync(toDelete.id);
      setToDelete(null);
      if (wasLastOnPage) setPage((p) => Math.max(1, p - 1));
    } catch (err) {
      setDeleteError(getFriendlyErrorMessage(err, 'Erro ao excluir confirmação.'));
    }
  }

  const columns: GenericTableColumn<AttendanceConfirmation>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (c) => <span className="font-medium text-gray-800">{c.name}</span>,
    },
    { key: 'contact', label: 'Contato', render: (c) => c.contact },
    { key: 'createdAt', label: 'Confirmado em', render: (c) => formatDateTime(c.createdAt) },
  ];

  const actions: GenericTableAction<AttendanceConfirmation>[] = [
    {
      label: 'Excluir',
      variant: 'danger',
      onClick: (c) => {
        setDeleteError(null);
        setToDelete(c);
      },
    },
  ];

  return (
    <>
      <Header
        title={`Confirmações de presença${data ? ` — ${data.event.name}` : ''}`}
        description="Registro informativo: não reserva lugar (RN012)."
        actions={[{ label: 'Voltar para o evento', onClick: backToEvent }]}
        onBack={() => router.back()}
      />

      {isError && (
        <p className="mt-4 text-sm text-red-600">
          {getFriendlyErrorMessage(error, 'Erro ao carregar confirmações.')}{' '}
          <button onClick={() => refetch()} className="underline">
            Tentar novamente
          </button>
        </p>
      )}

      <p className="mt-6 text-sm font-semibold text-gray-700">
        {isLoading ? 'Confirmações' : `${data?.total ?? 0} confirmação(ões)`}
      </p>

      <div className="my-4">
        <GenericTable
          columns={columns}
          items={data?.data ?? []}
          rowKey={(c) => c.id}
          actions={actions}
          isLoading={isLoading}
          loadingMessage="Carregando confirmações..."
          emptyMessage="Nenhuma confirmação de presença registrada para este evento."
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Buscar por nome ou contato..."
          filters={[
            {
              key: 'order',
              placeholder: 'Ordem',
              value: order,
              onChange: (v) => {
                setOrder(v as 'asc' | 'desc');
                setPage(1);
              },
              options: [
                { value: 'desc', label: 'Mais recentes' },
                { value: 'asc', label: 'Mais antigas' },
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

      {toDelete && (
        <Modal open onClose={() => setToDelete(null)} title="Excluir confirmação">
          <div className="flex flex-col gap-4 text-sm text-gray-700">
            <p>
              Excluir a confirmação de <strong>{toDelete.name}</strong>? Os dados pessoais serão
              apagados definitivamente (LGPD) e não podem ser recuperados.
            </p>
            {deleteError && <p className="text-red-600">{deleteError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setToDelete(null)}
                disabled={deleteConfirmation.isPending}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteConfirmation.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}