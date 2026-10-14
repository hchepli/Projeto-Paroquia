import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import Button from "@/components/ui/buttons/Button";
import { EventStatus } from "@/types/event/eventListItem";
import { formatEventDate, formatEventTime } from "@/utils/date";

interface EventListCardProps {
    slug: string;
    name: string;
    description: string;
    category: string;
    location: string;
    startDate: string;
    image: string;
    status: EventStatus;
}

export default function EventListCard({
    slug,
    name,
    description,
    category,
    location,
    startDate,
    image,
    status,
}: EventListCardProps) {
    const isPast = status === "past";
    const isToday = status === "today";

    return (
        <div
            className={`w-full flex flex-col sm:flex-row gap-5 lg:gap-6 rounded-2xl border p-4 sm:p-5 lg:p-6 transition-colors ${
                isToday
                    ? "border-[#701513] bg-[#701513]/5"
                    : isPast
                    ? "border-gray-200 bg-gray-50"
                    : "border-gray-200 bg-white"
            }`}
        >
            {/* Imagem */}
            <div className="w-full sm:w-[220px] lg:w-[242px] shrink-0">
                <img
                    src={image}
                    alt={name}
                    className={`w-full h-[140px] sm:h-[130px] lg:h-[144px] object-cover rounded-xl ${
                        isPast ? "grayscale opacity-60" : ""
                    }`}
                />
            </div>

            {/* Conteúdo */}
            <div className="flex flex-1 flex-col gap-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span
                        className={`text-xs font-medium rounded-full px-3 py-1 ${
                            isPast
                                ? "bg-gray-200 text-black/50"
                                : isToday
                                ? "bg-[#701513] text-white"
                                : "bg-[#701513]/10 text-[#701513]"
                        }`}
                    >
                        {category}
                    </span>

                    {isToday && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-[#701513]">
                            <Sparkles size={14} />
                            Hoje
                        </span>
                    )}
                </div>

                <h4 className={`text-lg sm:text-xl lg:text-2xl font-semibold ${isPast ? "text-black/50" : "text-black"}`}>
                    {name}
                </h4>

                <p className={`text-sm lg:text-base ${isPast ? "text-black/40" : "text-black/70"}`}>
                    {description}
                </p>

                <div
                    className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm lg:text-base ${
                        isPast ? "text-black/40" : "text-black/60"
                    }`}
                >
                    <span className="flex items-center gap-1">
                        <CalendarDays size={14} />
                        {formatEventDate(startDate)} às {formatEventTime(startDate)}
                    </span>
                    <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {location}
                    </span>
                </div>
            </div>

            {/* Ação */}
            <div className="flex sm:flex-col items-start sm:items-end justify-end sm:justify-center gap-2 shrink-0">
                <Button href={`/eventos/${slug}`} variant={isPast ? "secondary-dark" : "primary"} size="sm" icon>
                    Ver Detalhes
                </Button>
            </div>
        </div>
    );
}
