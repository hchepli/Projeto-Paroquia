import { CalendarDays, ArrowUpRight } from 'lucide-react';

interface EventPreviewItem {
  id: number;
  day: string; // "15"
  month: string; // "Mai"
  title: string;
  subtitle: string; // "Sab 09h00 - 19h00"
}

interface EventsPreviewCardProps {
  title: string;
  items: EventPreviewItem[];
  onViewAll?: () => void;
  isLoading?: boolean;
}

export default function EventsPreviewCard({
  title,
  items,
  onViewAll,
  isLoading,
}: EventsPreviewCardProps) {
  return (
    <div className="flex h-full flex-col rounded-[16px] border border-[rgba(0,0,0,0.3)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-[rgba(0,0,0,0.05)]">
            <CalendarDays width={16} />
          </div>
          <p className="font-medium text-[rgba(0,0,0,0.8)]">{title}</p>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-sm text-[rgba(0,0,0,0.5)] hover:text-[#701513]"
        >
          Ver Todos <ArrowUpRight size={14} />
        </button>
      </div>

      <div className="flex flex-col">
        {isLoading ? (
          <p className="py-6 text-center text-sm text-[rgba(0,0,0,0.4)]">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-[rgba(0,0,0,0.4)]">
            Nenhum evento nos próximos dias.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 border-t border-[rgba(0,0,0,0.08)] py-3 first:border-t-0"
            >
              <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-[rgba(0,0,0,0.15)] py-1">
                <span className="text-[16px] font-semibold leading-tight text-[rgba(0,0,0,0.8)]">
                  {item.day}
                </span>
                <span className="text-[10px] uppercase text-[rgba(0,0,0,0.5)]">{item.month}</span>
              </div>
              <div className="flex flex-col">
                <p className="text-[14px] font-medium text-[rgba(0,0,0,0.85)]">{item.title}</p>
                <p className="text-[12px] text-[rgba(0,0,0,0.5)]">{item.subtitle}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
