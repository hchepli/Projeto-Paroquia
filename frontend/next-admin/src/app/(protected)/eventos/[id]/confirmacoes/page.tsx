// src/app/(protected)/eventos/[id]/confirmacoes/page.tsx
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
  const d = new Date(iso);
  const date = d.toLocaleDateString('pt-BR');
  const time = d
    .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    .replace(':', 'h');
  return `${date} às ${time}`;
}

export default function ConfirmacoesPresencaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const eventId = Number(params.id);
  const validId = Number.isFinite(eventId) && eventId > 0;

  const { canManageEvents, isLoading: permLoading } = usePermissions();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [toDelete, setToDelete] = useState<AttendanceConfirmation | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const deleteConfirmation = useDeleteAttendanceConfirmation();

  // Coordenador (ou id inválido) nem dispara a consulta (o back responderia 403/400).
  const { data, isLoading, isError, error, refetch } = useAttendanceConfirmations({
    eventId: validId ? eventId : null,
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    order,
    enabled: canManageEvents,
  });

  const eventPath = validId ? `/eventos/${eventId}` : '/eventos';
  const backToEvent = () => router.push(eventPath);

  if (permLoading) return <p className="mt-8 text-base text-gray-600">Carregando...</p>;

  const forbidden = !canManageEvents || (error instanceof ApiError && error.status === 403);
  if (forbidden) {
    return (
      <>
        <Header title="Quem vai" description="" onBack={backToEvent} />
        <p role="alert" className="mt-8 text-base text-gray-800">
          Acesso restrito. Só o Admin Geral e a Secretaria podem ver quem avisou que vai ao evento.
        </p>
      </>
    );
  }

  if (!validId) {
    return (
      <>
        <Header title="Quem vai" description="" onBack={() => router.push('/eventos')} />
        <p role="alert" className="mt-8 text-base text-red-700">
          Evento não encontrado. Volte para a lista de eventos e escolha de novo.
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
      setDeleteError(
        getFriendlyErrorMessage(err, 'Não foi possível remover esta pessoa da lista. Tente de novo.'),
      );
    }
  }

  const columns: GenericTableColumn<AttendanceConfirmation>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (c) => <span className="font-medium text-gray-800">{c.name}</span>,
    },
    { key: 'contact', label: 'Contato', render: (c) => c.contact },
    { key: 'createdAt', label: 'Avisou em', render: (c) => formatDateTime(c.createdAt) },
  ];

  const actions: GenericTableAction<AttendanceConfirmation>[] = [
    {
      label: 'Remover',
      variant: 'danger',
      onClick: (c) => {
        setDeleteError(null);
        setToDelete(c);
      },
    },
  ];

  const total = data?.total ?? 0;
  const totalText = isLoading
    ? 'Carregando a lista...'
    : debouncedSearch
      ? `${total} ${total === 1 ? 'resultado' : 'resultados'} para a busca`
      : total === 0
        ? 'Ninguém confirmou ainda.'
        : `Total: ${total} ${total === 1 ? 'pessoa avisou' : 'pessoas avisaram'} que vai.`;

  return (
    <>
      <Header
        title={`Quem vai${data ? ` — ${data.event.name}` : ''}`}
        description="Pessoas que avisaram pelo site que pretendem ir a este evento."
        onBack={backToEvent}
      />

      <div className="mt-6 max-w-2xl rounded-md bg-blue-50 px-3 py-2 text-base text-blue-900">
        Isto é só um registro de quem avisou que quer ir. <strong>Não reserva lugar.</strong>
      </div>

      {isError && (
        <div role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-base text-red-700">
          {getFriendlyErrorMessage(
            error,
            'Não foi possível carregar a lista. Verifique a internet e tente de novo.',
          )}{' '}
          <button type="button" onClick={() => refetch()} className="font-medium underline">
            Tentar novamente
          </button>
        </div>
      )}

      <p className="mt-6 text-base font-semibold text-gray-800">{totalText}</p>

      <div className="my-4">
        <GenericTable
          columns={columns}
          items={data?.data ?? []}
          rowKey={(c) => c.id}
          actions={actions}
          isLoading={isLoading}
          loadingMessage="Carregando a lista... um instante."
          emptyMessage={
            debouncedSearch
              ? 'Ninguém encontrado com essa busca. Tente outro nome ou contato.'
              : 'Ninguém confirmou ainda. Quando alguém avisar pelo site que vai, o nome aparece aqui.'
          }
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
                { value: 'desc', label: 'Mais recentes primeiro' },
                { value: 'asc', label: 'Mais antigas primeiro' },
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
        <Modal open onClose={() => setToDelete(null)} title="Remover da lista">
          <div className="flex flex-col gap-4 text-base text-gray-800">
            <p>
              Remover <strong>{toDelete.name}</strong> da lista? O nome e o contato serão apagados
              para sempre e não dá para desfazer. Faça isso quando a pessoa pedir para ser removida.
            </p>
            {deleteError && (
              <p role="alert" className="text-red-700">
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setToDelete(null)}
                disabled={deleteConfirmation.isPending}
                className="rounded-lg bg-gray-100 px-4 py-2.5 text-base font-medium hover:bg-gray-200 disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-base font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteConfirmation.isPending ? 'Removendo...' : 'Sim, remover'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
