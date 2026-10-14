"use client";

import { use } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft } from "lucide-react";
import Container from "@/components/layout/Container";
import EventDetailSidebar from "@/components/ui/cards/EventDetailSidebar";
import EventGallery from "@/components/ui/cards/EventGallery";
import EventFaq from "@/components/ui/layout/EventFaq";
import { useEvent } from "@/hooks/useEvent";

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = use(params);
  const { data: event, loading } = useEvent(slug);

  return (
    <Container className="w-full min-h-screen mt-20 pt-20 pb-20">
      <Link
        href="/eventos"
        className="inline-flex items-center gap-1 text-sm text-black/60 hover:text-black transition-colors mb-6"
      >
        <ChevronLeft size={16} />
        Voltar para Eventos
      </Link>

      {loading || !event ? (
        loading ? (
          <p className="text-black/60 pb-20">Carregando evento...</p>
        ) : (
          <div className="flex flex-col gap-3 py-20 text-center">
            <p className="text-black/70 text-lg font-medium">Evento não encontrado.</p>
            <Link href="/eventos" className="text-[#701513] underline w-fit mx-auto">
              Voltar para a lista de eventos
            </Link>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-14">
          {event.recordStatus === "CANCELADO" && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
              Este evento foi cancelado pela paróquia. As informações abaixo são mantidas apenas para referência.
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            {/* Conteúdo principal */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">
              <img
                src={event.image}
                alt={event.name}
                className={`w-full h-[220px] sm:h-[320px] lg:h-[400px] object-cover rounded-2xl ${
                  event.status === "past" ? "grayscale opacity-70" : ""
                }`}
              />

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-black/50 text-sm">
                  <CalendarDays size={16} />
                  {event.status === "today" && (
                    <span className="font-semibold text-[#701513]">Acontece hoje</span>
                  )}
                  {event.status === "past" && <span>Evento encerrado</span>}
                  {event.status === "future" && <span>Programado</span>}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-black">
                  {event.name}
                </h1>

                <p className="text-black/70 text-base lg:text-lg leading-relaxed">
                  {event.description}
                </p>
              </div>

              <EventGallery photos={event.gallery} status={event.status} />
            </div>

            {/* Sidebar fixa */}
            <EventDetailSidebar
              category={event.category}
              startDate={event.startDate}
              endDate={event.endDate}
              location={event.location}
              status={event.status}
              whatsappHref={event.whatsappHref}
            />
          </div>

          <EventFaq items={event.faq} />
        </div>
      )}
    </Container>
  );
}