import { CoverageItem } from '@/hooks/schedules/useCoverage';

interface PendingSchedulesTableProps {
  items: CoverageItem[];
  isLoading?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function PendingSchedulesTable({ items, isLoading }: PendingSchedulesTableProps) {
  if (isLoading) {
    return (
      <div className="p-4 rounded-[16px] border border-[rgba(0,0,0,0.3)] w-full">
        <p className="font-normal text-sm text-[rgba(0,0,0,0.5)]">Carregando pendências...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-4 rounded-[16px] border border-[rgba(0,0,0,0.3)] w-full">
        <p className="font-normal text-sm text-[rgba(0,0,0,0.5)]">
          Nenhuma pendência no período — todas as Pastorais vinculadas já têm Escala.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[rgba(0,0,0,0.3)] w-full overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.02)]">
            <th className="text-left font-normal text-[rgba(0,0,0,0.5)] px-4 py-3">Tipo</th>
            <th className="text-left font-normal text-[rgba(0,0,0,0.5)] px-4 py-3">Missa/Evento</th>
            <th className="text-left font-normal text-[rgba(0,0,0,0.5)] px-4 py-3">Data</th>
            <th className="text-left font-normal text-[rgba(0,0,0,0.5)] px-4 py-3">Pastorais</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.sourceType}-${item.sourceId}`} className="border-b border-[rgba(0,0,0,0.05)] last:border-0">
              <td className="px-4 py-3">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-[rgba(0,0,0,0.8)]">
                  {item.sourceType === 'MASS' ? 'Missa' : 'Evento'}
                </span>
              </td>
              <td className="px-4 py-3 font-normal">{item.title}</td>
              <td className="px-4 py-3 text-[rgba(0,0,0,0.5)]">{formatDate(item.date)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {item.pastorals.map((p) => (
                    <span
                      key={p.id}
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        p.scheduled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {p.scheduled ? '✓' : '!'} {p.name}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}