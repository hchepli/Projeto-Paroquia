import { CalendarDays } from 'lucide-react';

interface Evento {
  nome: string;
  data: string;
}

interface EventsTableProps {
  title: string;
  items: Evento[];
}

export default function EventsTable({ title, items }: EventsTableProps) {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-[16px] border border-[rgba(0,0,0,0.3)] w-full">
      <div className="flex items-center gap-2">
        <CalendarDays width={18} className="text-[rgba(0,0,0,0.6)]" />
        <h6 className="font-medium text-lg">{title}</h6>
      </div>

      <ul className="flex flex-col">
        {items.map((evento, index) => (
          <li
            key={index}
            className="py-3 border-t border-[rgba(0,0,0,0.08)] first:border-t-0 text-sm text-[rgba(0,0,0,0.7)]"
          >
            {evento.nome} — {evento.data}
          </li>
        ))}

        {items.length === 0 && (
          <li className="py-6 text-center text-sm text-[rgba(0,0,0,0.4)]">
            Nenhum evento próximo.
          </li>
        )}
      </ul>
    </div>
  );
}