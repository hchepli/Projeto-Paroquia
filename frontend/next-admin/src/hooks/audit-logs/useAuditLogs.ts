import { useQuery } from '@tanstack/react-query';
import { AuditLog, AuditLogsPage } from '@/types/audit-logs/audit-logs';
import { throwApiError } from '@/lib/errors';

export interface UseAuditLogsParams {
  page?: number;
  limit?: number;
  entity?: string;
  action?: string;
}

interface AuditLogsResult {
  data: AuditLog[];
  total: number;
  forbidden: boolean;
}

async function fetchAuditLogs(params: UseAuditLogsParams): Promise<AuditLogsResult> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  }

  const res = await fetch(`/api/audit-logs?${qs.toString()}`);

  if (res.status === 403) {
    // Esperado para Coordenador de Pastoral: endpoint é Admin Geral/Secretaria only.
    return { data: [], total: 0, forbidden: true };
  }

  if (!res.ok) await throwApiError(res, 'Erro ao buscar movimentações.');

  const page: AuditLogsPage = await res.json();
  return { data: page.data, total: page.total, forbidden: false };
}

export function useAuditLogs(params: UseAuditLogsParams = {}) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => fetchAuditLogs(params),
  });
}