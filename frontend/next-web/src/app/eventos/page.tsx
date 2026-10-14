"use client";

import Container from "@/components/layout/Container";
import EventListCard from "@/components/ui/cards/EventListCard";
import { CalendarDays } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { EventListItem } from "@/types/event/eventListItem";
import { getMonthLabel } from "@/utils/date";

// Agrupa a lista (já ordenada cronologicamente pelo service) por "Mês de Ano",
// mantendo a ordem em que os meses aparecem.
function groupEventsByMonth(events: EventListItem[]): Array<[string, EventListItem[]]> {
    const groups = new Map<string, EventListItem[]>();

    for (const event of events) {
        const monthLabel = getMonthLabel(event.startDate);
        const group = groups.get(monthLabel);
        if (group) {
            group.push(event);
        } else {
            groups.set(monthLabel, [event]);
        }
    }

    return Array.from(groups.entries());
}

export default function Eventos() {
    const { data: events, loading } = useEvents();
    const groupedEvents = events ? groupEventsByMonth(events) : [];

    return (
        <Container className="w-full min-h-screen mt-20 pt-20">

            <div className="flex flex-col gap-1 pb-10">
                <div className="flex items-center gap-2 border-b-2 border-[#701513] pb-1">
                    <CalendarDays size={28} className="text-black shrink-0" />
                    <h2 className="text-xl sm:text-2xl lg:text-3xl tracking-wide font-semibold text-black">
                        Eventos da Paróquia
                    </h2>
                </div>
                <p className="text-black/60 text-base sm:text-lg">
                    Confira o que já aconteceu e o que vem por aí na nossa comunidade.
                </p>
            </div>

            {loading || !events ? (
                <p className="text-black/60 pb-20">Carregando eventos...</p>
            ) : (
                <div className="flex flex-col gap-14 pb-20">
                    {groupedEvents.map(([monthLabel, monthEvents]) => (
                        <section key={monthLabel} className="flex flex-col gap-5">
                            <h3 className="text-lg sm:text-xl font-semibold text-black/80 tracking-wide">
                                {monthLabel}
                            </h3>

                            <div className="flex flex-col gap-5">
                                {(() => {
                                    const cards = [];
                                    for (let i = 0; i < monthEvents.length; i++) {
                                        const event = monthEvents[i];
                                        cards.push(
                                            <EventListCard
                                                key={event.id}
                                                slug={event.slug}
                                                name={event.name}
                                                description={event.description}
                                                category={event.category}
                                                location={event.location}
                                                startDate={event.startDate}
                                                image={event.image}
                                                status={event.status}
                                            />
                                        );
                                    }
                                    return cards;
                                })()}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </Container>
    );
}
