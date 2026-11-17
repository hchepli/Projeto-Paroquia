'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import GenericTable, { GenericTableColumn } from '@/components/ui/tables/GenericTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { useAuditLogs } from '@/hooks/audit-logs/useAuditLogs';
import {
  ACTION_FILTER_OPTIONS,
  ENTITY_FILTER_OPTIONS,
  MovimentacaoRow,
  mapAuditLogToRow,
} from '@/lib/audit-log-mapper';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { ROUTES } from '@/config/routes';

const PAGE_SIZE = 15;

const columns: GenericTableColumn<MovimentacaoRow>[] = [
  {
    key: 'when',
    label: 'Quando',
    render: (r) => (
      <time dateTime={r.iso} aria-label={r.quandoCompleto} title={r.quandoCompleto}>
        {r.quando}
      </time>
    ),
  },
  { key: 'who', label: 'Quem', render: (r) => r.usuario },
  { key: 'what', label: 'O que aconteceu', render: (r) => r.frase },
];

const fieldClass =
  'rounded-lg border border-[rgba(0,0,0,0.2)] bg-white px-3 py-2 text-base text-[rgba(0,0,0,0.8)]';
const labelClass = 'flex flex-col gap-1 text-sm text-[rgba(0,0,0,0.6)]';

export default function AlteracoesPage() {
  const router = useRouter();
  const { canViewAuditLogs, isLoading: permLoading } = usePermissions();

  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const query = useAuditLogs(
    {
      page,
      limit: PAGE_SIZE,
      entity: entity || undefined,
      action: action || undefined,
      startDate: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
      endDate: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
    },
    { enabled: !permLoading && canViewAuditLogs },
  );

  const rows = useMemo(() => (query.data?.data ?? []).map(mapAuditLogToRow), [query.data]);
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE));
  const hasFilter = Boolean(entity || action || from || to);

  if (permLoading) return <p className="py-6 text-sm text-gray-500">Carregando...</p>;

  if (!canViewAuditLogs || query.data?.forbidden) {
    return (
      <>
        <Header
          title="Últimas alterações"
          actions={[{ label: 'Voltar ao início', onClick: () => router.push(ROUTES.inicio) }]}
        />
        <p role="alert" className="mt-8 text-base text-[rgba(0,0,0,0.7)]">
          Você não tem acesso a esta página. Se precisar dela, fale com a secretaria.
        </p>
      </>
    );
  }

  function clearFilters() {
    setEntity('');
    setAction('');
    setFrom('');
    setTo('');
    setPage(1);
  }

  return (
    <>
      <Header
        title="Últimas alterações"
        description="Veja o que foi criado, alterado ou apagado, da mais recente para a mais antiga."
      />

      <div className="mt-8 flex flex-wrap items-end gap-4">
        <label className={labelClass}>
          Tipo de item
          <select
            aria-label="Filtrar por tipo de item"
            className={fieldClass}
            value={entity}
            onChange={(e) => {
              setEntity(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            {ENTITY_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          O que foi feito
          <select
            aria-label="Filtrar pelo que foi feito"
            className={fieldClass}
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tudo</option>
            {ACTION_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          De
          <input
            type="date"
            aria-label="Mostrar alterações a partir de"
            className={fieldClass}
            value={from}
            max={to || undefined}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </label>

        <label className={labelClass}>
          Até
          <input
            type="date"
            aria-label="Mostrar alterações até"
            className={fieldClass}
            value={to}
            min={from || undefined}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </label>

        {hasFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg px-3 py-2 text-base font-medium underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {query.error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {getFriendlyErrorMessage(query.error, 'Não foi possível carregar as alterações.')} Tente de
          novo. Se continuar, avise a secretaria.
        </p>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={rows}
          rowKey={(r) => r.id}
          isLoading={query.isLoading}
          loadingMessage="Carregando alterações..."
          emptyMessage={
            hasFilter
              ? 'Nada encontrado com esses filtros. Tente mudar ou limpar os filtros.'
              : 'Ainda não há alterações registradas.'
          }
        />
        <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  );
}