import { useQuery } from '@tanstack/react-query';
import { AuditLog } from '@/types/audit-logs/audit-logs';

interface AuditLogsResult {
  data: AuditLog[];
  forbidden: boolean;
}

async function fetchAuditLogs(): Promise<AuditLogsResult> {
  const res = await fetch('/api/audit-logs');

  if (res.status === 403) {
    // Esperado pra Coordenador de Pastoral — endpoint é Admin Geral/Secretaria only.
    return { data: [], forbidden: true };
  }

  if (!res.ok) throw new Error('Erro ao buscar log de auditoria.');

  const data = await res.json();
  return { data, forbidden: false };
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: fetchAuditLogs,
  });
}