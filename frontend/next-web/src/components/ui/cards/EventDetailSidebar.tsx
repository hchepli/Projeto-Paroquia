import { CalendarDays, MapPin } from "lucide-react";
import Button from "@/components/ui/buttons/Button";
import { EventStatus } from "@/types/event/eventListItem";
import { formatEventDate, formatEventTime } from "@/utils/date";

interface EventDetailSidebarProps {
  category: string;
  startDate: string;
  endDate: string | null;
  location: string;
  status: EventStatus;
  whatsappHref: string;
}

export default function EventDetailSidebar({
  category,
  startDate,
  endDate,
  location,
  status,
  whatsappHref,
}: EventDetailSidebarProps) {
  const isPast = status === "past";

  return (
    <aside className="w-full lg:w-[320px] shrink-0">
      <div className="lg:sticky lg:top-28 flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-6">
        <span className="w-fit text-xs font-medium rounded-full px-3 py-1 bg-[#701513]/10 text-[#701513]">
          {category}
        </span>

        <div className="flex flex-col gap-3 text-black/70 text-sm lg:text-base">
          <span className="flex items-start gap-2">
            <CalendarDays size={18} className="shrink-0 mt-0.5" />
            <span>
              {formatEventDate(startDate)} às {formatEventTime(startDate)}
              {endDate && (
                <>
                  {" "}
                  até {formatEventDate(endDate)} às {formatEventTime(endDate)}
                </>
              )}
            </span>
          </span>

          <span className="flex items-start gap-2">
            <MapPin size={18} className="shrink-0 mt-0.5" />
            {location}
          </span>
        </div>

        {/* CTA abre uma conversa de WhatsApp já com a mensagem preenchida,
            usando o número cadastrado em contactInfoMock. Integração com
            back-end (confirmação de vaga, lista de inscritos etc.) fica
            para quando o back existir. */}
        {isPast ? (
          <Button variant="primary" size="default" className="w-full" disabled>
            Evento encerrado
          </Button>
        ) : (
          <Button
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            size="default"
            className="w-full"
          >
            Garantir Vaga
          </Button>
        )}
      </div>
    </aside>
  );
}
