export type AgendaItemColor = 'green' | 'purple' | 'yellow' | 'blue';

export interface AgendaItem {
  time: string;      // "6:00"
  title: string;      // "Missa"
  subtitle?: string;  // "6h00 às 7h30"
  color: AgendaItemColor;
}

interface AgendaTimelineProps {
  items: AgendaItem[];
}

const COLOR_MAP: Record<
  AgendaItemColor,
  { dot: string; line: string; border: string; chip: string }
> = {
  green:  { dot: 'bg-[#2E7D32]', line: 'bg-[#2E7D32]', border: 'border-[#2E7D32]', chip: 'bg-[#2E7D32]/30' },
  purple: { dot: 'bg-[#5E35B1]', line: 'bg-[#5E35B1]', border: 'border-[#5E35B1]', chip: 'bg-[#5E35B1]/30' },
  yellow: { dot: 'bg-[#C9A227]', line: 'bg-[#C9A227]', border: 'border-[#C9A227]', chip: 'bg-[#C9A227]/30' },
  blue:   { dot: 'bg-[#1976D2]', line: 'bg-[#1976D2]', border: 'border-[#1976D2]', chip: 'bg-[#1976D2]/30' },
};

export default function AgendaTimeline({ items }: AgendaTimelineProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        Nada agendado para este dia.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {items.map((item, i) => {
        const colors = COLOR_MAP[item.color];
        const isEmpty = !item.title;

        return (
          <div key={i} className="flex items-center gap-0">
            <span className="w-11 shrink-0 text-[13px] font-medium text-gray-700">
              {item.time}
            </span>

            <span className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />

            {isEmpty ? (
              <span className="h-px flex-1 bg-gray-800" />
            ) : (
              <>
                <span className={`h-px w-4 shrink-0 ${colors.line}`} />
                <div
                  className={`flex items-center gap-2 rounded-xl border bg-white p-1 min-w-[150px] ${colors.border}`}
                >
                  <span className={`h-8 w-8 shrink-0 rounded-lg ${colors.chip}`} />
                  <div className="flex flex-col">
                    <p className="text-[14px] font-semibold leading-tight text-black">
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-[11px] text-gray-400 leading-tight">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`h-px flex-1 ${colors.line}`} />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}